/*******************************************
	PostProcessPoly.cpp

	Main scene and game functions
********************************************/

#include <Windows.h>
#include <sstream>
#include <string>
using namespace std;

#include <d3d10.h>
#include <d3dx10.h>

#include "Defines.h"
#include "CVector3.h"
#include "CVector4.h"
#include "Camera.h"
#include "Light.h"
#include "EntityManager.h"
#include "Messenger.h"
#include "CParseLevel.h"
#include "PostProcessPoly.h"

namespace gen
{

//*****************************************************************************
// Post-process data
//*****************************************************************************

// Enumeration of different post-processes
enum PostProcesses
{
	Copy, GradualTint, GaussianBlur_Horizontal, GaussianBlur_Vertical, ShockWave, DepthOfField,
	NumPostProcesses
};

// Currently used post process

// Post-process settings
const float twoPi = 6.28318530718f;
float tintHue = 0.0f;
float blur = 1.0f;
float shockwaveAngle = 0.0f;
float shockwaveVel = 0.0f;
float shockwaveStartSpeed = 30.0f;
float shockwaveStopSpeed = 15.0f;

// Separate effect file for full screen & area post-processes. Not necessary to use a separate file, but convenient given the architecture of this lab
ID3D10Effect* PPEffect;

// Technique name for each post-process
const string PPTechniqueNames[NumPostProcesses] = {	"PPCopy", "PPGradualTint", "PP2XGaussianBlur_Horizontal","PP2XGaussianBlur_Vertical","PPShockWave","PPDepthOfField"};
bool PPTechniqueEnabled[NumPostProcesses] = {false,false,false,false,false,false};

// Technique pointers for each post-process
ID3D10EffectTechnique* PPTechniques[NumPostProcesses];


// Will render the scene to a texture in a first pass, then copy that texture to the back buffer in a second post-processing pass
// So need a texture and two "views": a render target view (to render into the texture - 1st pass) and a shader resource view (use the rendered texture as a normal texture - 2nd pass)
ID3D10Texture2D*          SceneTexture_1 = NULL;
ID3D10Texture2D*		  SceneTexture_2 = NULL;
ID3D10RenderTargetView*   SceneRenderTarget_1 = NULL;
ID3D10RenderTargetView*   SceneRenderTarget_2 = NULL;
ID3D10ShaderResourceView* SceneShaderResource_1 = NULL;
ID3D10ShaderResourceView* SceneShaderResource_2 = NULL;

// Additional textures used by post-processes


// Variables to link C++ post-process textures to HLSL shader variables (for area / full-screen post-processing)
ID3D10EffectShaderResourceVariable* SceneTextureVar = NULL;
ID3D10EffectShaderResourceVariable* PostProcessMapVar = NULL; // Single shader variable used for the three maps above (noise, burn, distort). Only one is needed at a time

// Variables specifying the area used for post-processing
ID3D10EffectVectorVariable* PPAreaTopLeftVar = NULL;
ID3D10EffectVectorVariable* PPAreaBottomRightVar = NULL;
ID3D10EffectScalarVariable* PPAreaDepthVar = NULL;

// Other variables for individual post-processes
ID3D10EffectScalarVariable* tintHueVar = NULL;
ID3D10EffectScalarVariable* blurVar = NULL;
ID3D10EffectScalarVariable* shockwaveAngleVar = NULL;


//*****************************************************************************


//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------

// Control speed
const float CameraRotSpeed = 2.0f;
float CameraMoveSpeed = 80.0f;

// Amount of time to pass before calculating new average update time
const float UpdateTimePeriod = 0.25f;

//-----------------------------------------------------------------------------
// Global system variables
//-----------------------------------------------------------------------------

// Folders used for meshes/textures and effect files
extern const string MediaFolder;
extern const string ShaderFolder;

// Get reference to global DirectX variables from another source file
extern ID3D10Device*           g_pd3dDevice;
extern IDXGISwapChain*         SwapChain;
extern ID3D10DepthStencilView* DepthStencilView;
extern ID3D10RenderTargetView* BackBufferRenderTarget;
extern ID3DX10Font*            OSDFont;

// Actual viewport dimensions (fullscreen or windowed)
extern TUInt32 BackBufferWidth;
extern TUInt32 BackBufferHeight;

// Current mouse position
extern TUInt32 MouseX;
extern TUInt32 MouseY;

// Messenger class for sending messages to and between entities
extern CMessenger Messenger;


//-----------------------------------------------------------------------------
// Global game/scene variables
//-----------------------------------------------------------------------------

// Entity manager and level parser
CEntityManager EntityManager;
CParseLevel LevelParser( &EntityManager );

// Other scene elements
const int NumLights = 2;
CLight*  Lights[NumLights];
CCamera* MainCamera;

// Sum of recent update times and number of times in the sum - used to calculate
// average over a given time period
float SumUpdateTimes = 0.0f;
int NumUpdateTimes = 0;
float AverageUpdateTime = -1.0f; // Invalid value at first


//-----------------------------------------------------------------------------
// Game Constants
//-----------------------------------------------------------------------------

// Lighting
const SColourRGBA AmbientColour( 0.3f, 0.3f, 0.4f, 1.0f );
CVector3 LightCentre( 0.0f, 30.0f, 50.0f );
const float LightOrbit = 170.0f;
const float LightOrbitSpeed = 0.2f;


//-----------------------------------------------------------------------------
// Scene management
//-----------------------------------------------------------------------------

// Creates the scene geometry
bool SceneSetup()
{
	// Prepare render methods
	InitialiseMethods();
	
	// Read templates and entities from XML file
	if (!LevelParser.ParseFile( "Entities.xml" )) return false;
	
	// Set camera position and clip planes
	MainCamera = new CCamera( CVector3( 25, 30, -115 ), CVector3(ToRadians(8.0f), ToRadians(-35.0f), 0) );
	MainCamera->SetNearFarClip( 2.0f, 300000.0f ); 

	// Sunlight
	Lights[0] = new CLight( CVector3( -10000.0f, 6000.0f, 0000.0f), SColourRGBA(1.0f, 0.8f, 0.6f) * 12000, 20000.0f ); // Colour is multiplied by light brightness

	// Light orbiting area
	Lights[1] = new CLight( LightCentre, SColourRGBA(0.0f, 0.2f, 1.0f) * 50, 100.0f );

	return true;
}


// Release everything in the scene
void SceneShutdown()
{
	// Release render methods
	ReleaseMethods();

	// Release lights
	for (int light = NumLights - 1; light >= 0; --light)
	{
		delete Lights[light];
	}

	// Release camera
	delete MainCamera;

	// Destroy all entities
	EntityManager.DestroyAllEntities();
	EntityManager.DestroyAllTemplates();
}


//*****************************************************************************
// Post Processing Setup
//*****************************************************************************

// Prepare resources required for the post-processing pass
bool PostProcessSetup()
{
	// Create the "scene texture" - the texture into which the scene will be rendered in the first pass
	D3D10_TEXTURE2D_DESC textureDesc;
	textureDesc.Width  = BackBufferWidth;  // Match views to viewport size
	textureDesc.Height = BackBufferHeight;
	textureDesc.MipLevels = 1; // No mip-maps when rendering to textures (or we will have to render every level)
	textureDesc.ArraySize = 1;
	textureDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM; // RGBA texture (8-bits each)
	textureDesc.SampleDesc.Count = 1;
	textureDesc.SampleDesc.Quality = 0;
	textureDesc.Usage = D3D10_USAGE_DEFAULT;
	textureDesc.BindFlags = D3D10_BIND_RENDER_TARGET | D3D10_BIND_SHADER_RESOURCE; // Indicate we will use texture as render target, and pass it to shaders
	textureDesc.CPUAccessFlags = 0;
	textureDesc.MiscFlags = 0;
	if (FAILED(g_pd3dDevice->CreateTexture2D( &textureDesc, NULL, &SceneTexture_1))) return false;
	if (FAILED(g_pd3dDevice->CreateTexture2D( &textureDesc, NULL, &SceneTexture_2))) return false;

	// Get a "view" of the texture as a render target - giving us an interface for rendering to the texture
	if (FAILED(g_pd3dDevice->CreateRenderTargetView( SceneTexture_1, NULL, &SceneRenderTarget_1))) return false;
	if (FAILED(g_pd3dDevice->CreateRenderTargetView( SceneTexture_2, NULL, &SceneRenderTarget_2))) return false;
	//if (FAILED(g_pd3dDevice->CreateRenderTargetView( SceneTexture2, NULL, &SceneRenderTarget2))) return false;

	// And get a shader-resource "view" - giving us an interface for passing the texture to shaders
	D3D10_SHADER_RESOURCE_VIEW_DESC srDesc;
	srDesc.Format = textureDesc.Format;
	srDesc.ViewDimension = D3D10_SRV_DIMENSION_TEXTURE2D;
	srDesc.Texture2D.MostDetailedMip = 0;
	srDesc.Texture2D.MipLevels = 1;
	if (FAILED(g_pd3dDevice->CreateShaderResourceView(SceneTexture_1, &srDesc, &SceneShaderResource_1 ))) return false;
	if (FAILED(g_pd3dDevice->CreateShaderResourceView(SceneTexture_2, &srDesc, &SceneShaderResource_2))) return false;

	// Load post-processing support textures


	// Load and compile a separate effect file for post-processes.
	ID3D10Blob* pErrors;
	DWORD dwShaderFlags = D3D10_SHADER_ENABLE_STRICTNESS; // These "flags" are used to set the compiler options

	string fullFileName = ShaderFolder + "PostProcess.fx";
	if( FAILED( D3DX10CreateEffectFromFile( fullFileName.c_str(), NULL, NULL, "fx_4_0", dwShaderFlags, 0, g_pd3dDevice, NULL, NULL, &PPEffect, &pErrors, NULL ) ))
	{
		if (pErrors != 0)  MessageBox( NULL, reinterpret_cast<char*>(pErrors->GetBufferPointer()), "Error", MB_OK ); // Compiler error: display error message
		else               MessageBox( NULL, "Error loading FX file. Ensure your FX file is in the same folder as this executable.", "Error", MB_OK );  // No error message - probably file not found
		return false;
	}

	// There's an array of post-processing technique names above - get array of post-process techniques matching those names from the compiled effect file
	for (int pp = 0; pp < NumPostProcesses; pp++)
	{
		PPTechniques[pp] = PPEffect->GetTechniqueByName( PPTechniqueNames[pp].c_str() );
	}

	// Link to HLSL variables in post-process shaders
	SceneTextureVar      = PPEffect->GetVariableByName( "SceneTexture" )->AsShaderResource();
	PostProcessMapVar    = PPEffect->GetVariableByName( "PostProcessMap" )->AsShaderResource();
	PPAreaTopLeftVar     = PPEffect->GetVariableByName( "PPAreaTopLeft" )->AsVector();
	PPAreaBottomRightVar = PPEffect->GetVariableByName( "PPAreaBottomRight" )->AsVector();
	PPAreaDepthVar       = PPEffect->GetVariableByName( "PPAreaDepth" )->AsScalar();
	tintHueVar			 = PPEffect->GetVariableByName( "tintHue" )->AsScalar();
	blurVar				 = PPEffect->GetVariableByName("blur")->AsScalar();
	shockwaveAngleVar	 = PPEffect->GetVariableByName( "shockwaveAngle")->AsScalar();
	return true;
}

void PostProcessShutdown()
{
	if (SceneShaderResource_1) SceneShaderResource_1->Release();
	if (SceneShaderResource_2) SceneShaderResource_2->Release();
	if (SceneRenderTarget_1)   SceneRenderTarget_1->Release();
	if (SceneRenderTarget_2)   SceneRenderTarget_2->Release();
	if (SceneTexture_1)        SceneTexture_1->Release();
	if (SceneTexture_2)        SceneTexture_2->Release();
}

//*****************************************************************************


//-----------------------------------------------------------------------------
// Post Process Setup / Update
//-----------------------------------------------------------------------------

// Set up shaders for given post-processing filter (used for full screen and area processing)
void SelectPostProcess( PostProcesses filter )
{
	switch (filter) {
		case GradualTint:
			tintHueVar->SetRawValue( &tintHue, 0, 4 );
		break;

		case GaussianBlur_Horizontal:
			blurVar->SetRawValue(&blur,0,4);
		break;

		case ShockWave:
			shockwaveAngleVar->SetRawValue(&shockwaveAngle,0,4);
		break;
	}
}

// Update post-processes (those that need updating) during scene update
void UpdatePostProcesses( float updateTime )
{
	// Not all post processes need updating
	if (PPTechniqueEnabled[GradualTint]) {
		tintHue += 0.2f * updateTime;
		if (tintHue > 1.0f) tintHue = 0.0f;
	}

	if (PPTechniqueEnabled[GaussianBlur_Horizontal]) {
		if (KeyHit(Key_Plus)) blur -= 0.1f;
		if (KeyHit(Key_Minus)) blur += 0.1f;

		if (blur < 0.1f) blur = 0.1f;
		if (blur > 1.5f) blur = 1.5f;
	}

	if (PPTechniqueEnabled[ShockWave]) {
		shockwaveAngle += shockwaveVel * updateTime;
		shockwaveVel -= shockwaveStopSpeed * updateTime;
		if (shockwaveAngle > twoPi) {
			shockwaveAngle = 0.0f;
			if (shockwaveVel < 2.5f) PPTechniqueEnabled[ShockWave] = false;
		}

		if (shockwaveVel < 2.5f) shockwaveVel = 2.5f;
	}
}

void SetFullScreenPostProcessArea()
{
	CVector2 TopLeftUV     = CVector2( 0.0f, 0.0f ); // Top-left and bottom-right in UV space
	CVector2 BottomRightUV = CVector2( 1.0f, 1.0f );

	PPAreaTopLeftVar->SetRawValue( &TopLeftUV, 0, 8 );
	PPAreaBottomRightVar->SetRawValue( &BottomRightUV, 0, 8 );
	PPAreaDepthVar->SetFloat( 0.0f ); // Full screen depth set at 0 - in front of everything
}


// Helper functions used to flip between two active framebuffers
// The exact purpose is to allow for an arbitary number of fullscreen post processes to be active
bool bufferActive = true;

void flipActiveFramebuffer() {
	bufferActive = !bufferActive;
	
	if (bufferActive) {
		g_pd3dDevice->OMSetRenderTargets(1, &SceneRenderTarget_1, DepthStencilView);
		SceneTextureVar->SetResource(SceneShaderResource_2);
	} else {
		g_pd3dDevice->OMSetRenderTargets(1, &SceneRenderTarget_2, DepthStencilView);
		SceneTextureVar->SetResource(SceneShaderResource_1);
	}
}

void setBackbuffer() {
	g_pd3dDevice->OMSetRenderTargets(1, &BackBufferRenderTarget, DepthStencilView);

	if (bufferActive) {
		SceneTextureVar->SetResource(SceneShaderResource_1);
	}
	else {
		SceneTextureVar->SetResource(SceneShaderResource_2);
	}
}

void draw(PostProcesses technique) {
	SelectPostProcess(technique);
	g_pd3dDevice->IASetInputLayout(NULL);
	g_pd3dDevice->IASetPrimitiveTopology(D3D10_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
	PPTechniques[technique]->GetPassByIndex(0)->Apply(0);
	g_pd3dDevice->Draw(4, 0);
}

//-----------------------------------------------------------------------------
// Game loop functions
//-----------------------------------------------------------------------------

// Draw one frame of the scene
void RenderScene() {
	// Setup the viewport - defines which part of the back-buffer we will render to (usually all of it)
	D3D10_VIEWPORT vp;
	vp.Width = BackBufferWidth;
	vp.Height = BackBufferHeight;
	vp.MinDepth = 0.0f;
	vp.MaxDepth = 1.0f;
	vp.TopLeftX = 0;
	vp.TopLeftY = 0;
	g_pd3dDevice->RSSetViewports(1, &vp);


	//------------------------------------------------
	// SCENE RENDER PASS - rendering to a texture

	// Specify that we will render to the scene texture in this first pass (rather than the backbuffer), will share the depth/stencil buffer with the backbuffer though
	g_pd3dDevice->OMSetRenderTargets(1, &SceneRenderTarget_1, DepthStencilView);

	// Reset Selected Framebuffer
	bufferActive = true;

	// Clear the texture and the depth buffer
	g_pd3dDevice->ClearRenderTargetView(SceneRenderTarget_1, &AmbientColour.r);
	g_pd3dDevice->ClearRenderTargetView(SceneRenderTarget_2, &AmbientColour.r);
	g_pd3dDevice->ClearDepthStencilView(DepthStencilView, D3D10_CLEAR_DEPTH, 1.0f, 0);

	// Prepare camera
	MainCamera->SetAspect(static_cast<TFloat32>(BackBufferWidth) / BackBufferHeight);
	MainCamera->CalculateMatrices();
	MainCamera->CalculateFrustrumPlanes();

	// Set camera and light data in shaders
	SetCamera(MainCamera);
	SetAmbientLight(AmbientColour);
	SetLights(&Lights[0]);

	// Render entities
	EntityManager.RenderAllEntities(MainCamera);

	// Copy Scene to second framebuffer
	flipActiveFramebuffer();
	SetFullScreenPostProcessArea();
	draw(Copy);

	// Polygon Post Processing
	flipActiveFramebuffer();
	SetSceneTexture(SceneShaderResource_2,BackBufferWidth,BackBufferHeight);
	EntityManager.RenderAllEntities(MainCamera,true);

	// Toggable Fullscreen Post Processing
	if (PPTechniqueEnabled[DepthOfField]) {
		flipActiveFramebuffer();
		SetFullScreenPostProcessArea();
		draw(DepthOfField);
	}

	if (PPTechniqueEnabled[GradualTint]) {
		flipActiveFramebuffer();
		SetFullScreenPostProcessArea();
		draw(GradualTint);
	}

	if (PPTechniqueEnabled[GaussianBlur_Horizontal]) {
		SetFullScreenPostProcessArea();

		flipActiveFramebuffer();
		draw(GaussianBlur_Horizontal);

		flipActiveFramebuffer();
		draw(GaussianBlur_Vertical);
	}

	if (PPTechniqueEnabled[ShockWave]) {
		flipActiveFramebuffer();
		SetFullScreenPostProcessArea();
		draw(ShockWave);
	}

	setBackbuffer();

	// Prepare shader settings for the current full screen filter
	SelectPostProcess(Copy);
	SetFullScreenPostProcessArea();

	g_pd3dDevice->IASetInputLayout(NULL);
	g_pd3dDevice->IASetPrimitiveTopology(D3D10_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
	PPTechniques[Copy]->GetPassByIndex(0)->Apply(0);
	g_pd3dDevice->Draw(4, 0);

	// These two lines unbind the scene texture from the shader to stop DirectX issuing a warning when we try to render to it again next frame
	SceneTextureVar->SetResource(0);
	PPTechniques[Copy]->GetPassByIndex(0)->Apply(0);

	// Render UI elements last - don't want them post-processed
	RenderSceneText();

	// Present the backbuffer contents to the display
	SwapChain->Present(0, 0);
}


// Render a single text string at the given position in the given colour, may optionally centre it
void RenderText( const string& text, int X, int Y, float r, float g, float b, bool centre = false )
{
	RECT rect;
	if (!centre)
	{
		SetRect( &rect, X, Y, 0, 0 );
		OSDFont->DrawText( NULL, text.c_str(), -1, &rect, DT_NOCLIP, D3DXCOLOR( r, g, b, 1.0f ) );
	}
	else
	{
		SetRect( &rect, X - 100, Y, X + 100, 0 );
		OSDFont->DrawText( NULL, text.c_str(), -1, &rect, DT_CENTER | DT_NOCLIP, D3DXCOLOR( r, g, b, 1.0f ) );
	}
}

// Render on-screen text each frame
void RenderSceneText()
{
	// Write FPS text string
	stringstream outText;
	if (AverageUpdateTime >= 0.0f)
	{
		outText << "Frame Time: " << AverageUpdateTime * 1000.0f << "ms" << endl << "FPS:" << 1.0f / AverageUpdateTime;
		RenderText( outText.str(), 2, 2, 0.0f, 0.0f, 0.0f );
		RenderText( outText.str(), 0, 0, 1.0f, 1.0f, 0.0f );
		outText.str("");
	}

	outText << "Enabled Fullscreen Post-Processes: ";

	if (PPTechniqueEnabled[GradualTint]) outText << "Gradual Tint ";
	if (PPTechniqueEnabled[GaussianBlur_Horizontal]) outText << "2X Gaussian Blur ";
	if (PPTechniqueEnabled[ShockWave]) outText << "Shockwave ";
	if (PPTechniqueEnabled[DepthOfField]) outText << "Depth Of Feild ";

	RenderText( outText.str(),  0, 32,  1.0f, 1.0f, 1.0f );
}


// Update the scene between rendering
void UpdateScene( float updateTime )
{
	// Call all entity update functions
	EntityManager.UpdateAllEntities( updateTime );

	// Update any post processes that need updates
	UpdatePostProcesses( updateTime );

	// Set camera speeds
	// Key F1 used for full screen toggle
	if (KeyHit( Key_F2 )) CameraMoveSpeed = 5.0f;
	if (KeyHit( Key_F3 )) CameraMoveSpeed = 40.0f;
	if (KeyHit( Key_F4 )) CameraMoveSpeed = 160.0f;
	if (KeyHit( Key_F5 )) CameraMoveSpeed = 640.0f;

	if (KeyHit(Key_1)) PPTechniqueEnabled[GradualTint] = !PPTechniqueEnabled[GradualTint];
	if (KeyHit(Key_2)) PPTechniqueEnabled[GaussianBlur_Horizontal] = !PPTechniqueEnabled[GaussianBlur_Horizontal];
	if (KeyHit(Key_3)) { PPTechniqueEnabled[ShockWave] = true; shockwaveVel = shockwaveStartSpeed; }
	if (KeyHit(Key_4)) PPTechniqueEnabled[DepthOfField] = !PPTechniqueEnabled[DepthOfField];

	// Rotate cube and attach light to it
	CEntity* cubey = EntityManager.GetEntity( "Cubey" );
	cubey->Matrix().RotateX( ToRadians(53.0f) * updateTime );
	cubey->Matrix().RotateZ( ToRadians(42.0f) * updateTime );
	cubey->Matrix().RotateWorldY( ToRadians(12.0f) * updateTime );
	Lights[1]->SetPosition( cubey->Position() );

	// Move the camera
	MainCamera->Control( Key_Up, Key_Down, Key_Left, Key_Right, Key_W, Key_S, Key_A, Key_D, 
	                     CameraMoveSpeed * updateTime, CameraRotSpeed * updateTime );

	// Accumulate update times to calculate the average over a given period
	SumUpdateTimes += updateTime;
	++NumUpdateTimes;
	if (SumUpdateTimes >= UpdateTimePeriod)
	{
		AverageUpdateTime = SumUpdateTimes / NumUpdateTimes;
		SumUpdateTimes = 0.0f;
		NumUpdateTimes = 0;
	}
}


} // namespace gen
