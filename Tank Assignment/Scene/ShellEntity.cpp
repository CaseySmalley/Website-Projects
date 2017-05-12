/*******************************************
	ShellEntity.cpp

	Shell entity class
********************************************/

#include "ShellEntity.h"
#include "TankEntity.h"
#include "EntityManager.h"
#include "Messenger.h"

namespace gen
{

// Reference to entity manager from TankAssignment.cpp, allows look up of entities by name, UID etc.
// Can then access other entity's data. See the CEntityManager.h file for functions. Example:
//    CVector3 targetPos = EntityManager.GetEntity( targetUID )->GetMatrix().Position();
extern CEntityManager EntityManager;

// Messenger class for sending messages to and between entities
extern CMessenger Messenger;

// Helper function made available from TankAssignment.cpp - gets UID of tank A (team 0) or B (team 1).
// Will be needed to implement the required shell behaviour in the Update function below
extern vector<TEntityUID> GetTankUID( int team );


/*-----------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------
	Shell Entity Class
-------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------*/

// Shell constructor intialises shell-specific data and passes its parameters to the base
// class constructor
CShellEntity::CShellEntity
(
	CEntityTemplate* entityTemplate,
	TEntityUID       UID,
	const string&    name /*=""*/,
	const CVector3&  position /*= CVector3::kOrigin*/, 
	const CVector3&  rotation /*= CVector3( 0.0f, 0.0f, 0.0f )*/,
	const CVector3&  scale /*= CVector3( 1.0f, 1.0f, 1.0f )*/,
	const TInt32& team
) : CEntity( entityTemplate, UID, name, position, rotation, scale )
{
	m_Team = team;
	m_Velocity = rotation * SPEED;
	m_Timer = 3.0;
}

TFloat32 CShellEntity::SPEED = 50.0f;
TFloat32 CShellEntity::COLLISION_RADIUS = 0.5f;
TFloat32 CShellEntity::TANK_COLLISION_RADIUS = 3.0f;

// Update the shell - controls its behaviour. The shell code is empty, it needs to be written as
// one of the assignment requirements
// Return false if the entity is to be destroyed
bool CShellEntity::Update( TFloat32 updateTime )
{
	Matrix().SetPosition(Matrix().Position() + m_Velocity * updateTime);

	// get team list of the enemy of the tank that fired it
	CEntity* target = nullptr;
	CVector3 dist;
	vector<TEntityUID> team = GetTankUID(m_Team);
	for (unsigned int i = 0; i < team.size(); ++i) {
		target = EntityManager.GetEntity(team[i]);
		if (target != nullptr) {
			dist = Matrix().Position() - target->Matrix().Position();
			// Sphere to sphere collision with shell and enemy tank
			if (dist.Length() <  COLLISION_RADIUS + TANK_COLLISION_RADIUS) {
				Messenger.SendMessage(team[i], SMessage(Msg_Hit)); // cause damage to enemy tank
				return false; // destroy after hitting tank
			}
		}
	}

	m_Timer -= updateTime;
	return m_Timer > 0.0f; // Destroy if lifetime has expired
}


} // namespace gen
