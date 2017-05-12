/*******************************************
	TankEntity.cpp

	Tank entity template and entity classes
********************************************/

// Additional technical notes for the assignment:
// - Each tank has a team number (0 or 1), HP and other instance data - see the end of TankEntity.h
//   You will need to add other instance data suitable for the assignment requirements
// - A function GetTankUID is defined in TankAssignment.cpp and made available here, which returns
//   the UID of the tank on a given team. This can be used to get the enemy tank UID
// - Tanks have three parts: the root, the body and the turret. Each part has its own matrix, which
//   can be accessed with the Matrix function - root: Matrix(), body: Matrix(1), turret: Matrix(2)
//   However, the body and turret matrix are relative to the root's matrix - so to get the actual 
//   world matrix of the body, for example, we must multiply: Matrix(1) * Matrix()
// - Vector facing work similar to the car tag lab will be needed for the turret->enemy facing 
//   requirements for the Patrol and Aim states
// - The CMatrix4x4 function DecomposeAffineEuler allows you to extract the x,y & z rotations
//   of a matrix. This can be used on the *relative* turret matrix to help in rotating it to face
//   forwards in Evade state
// - The CShellEntity class is simply an outline. To support shell firing, you will need to add
//   member data to it and rewrite its constructor & update function. You will also need to update 
//   the CreateShell function in EntityManager.cpp to pass any additional constructor data required
// - Destroy an entity by returning false from its Update function - the entity manager wil perform
//   the destruction. Don't try to call DestroyEntity from within the Update function.
// - As entities can be destroyed, you must check that entity UIDs refer to existant entities, before
//   using their entity pointers. The return value from EntityManager.GetEntity will be NULL if the
//   entity no longer exists. Use this to avoid trying to target a tank that no longer exists etc.

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
// Will be needed to implement the required tank behaviour in the Update function below
extern vector<TEntityUID> GetTankUID( int team );



/*-----------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------
	Tank Entity Class
-------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------*/

// Tank constructor intialises tank-specific data and passes its parameters to the base
// class constructor
CTankEntity::CTankEntity
(
	CTankTemplate*  tankTemplate,
	TEntityUID      UID,
	TUInt32         team,
	const vector<CVector3> patrolPath,
	const string&   name /*=""*/,
	const CVector3& position /*= CVector3::kOrigin*/, 
	const CVector3& rotation /*= CVector3( 0.0f, 0.0f, 0.0f )*/,
	const CVector3& scale /*= CVector3( 1.0f, 1.0f, 1.0f )*/
) : CEntity( tankTemplate, UID, name, position, rotation, scale )
{
	m_TankTemplate = tankTemplate;

	// Tanks are on teams so they know who the enemy is
	m_Team = team;

	// Initialise other tank data and state
	m_Speed = 0.0f;
	m_TurnSpeed = 0.0f;
	m_TurretTurnSpeed = 0.0f;
	m_HP = m_TankTemplate->GetMaxHP();
	m_TargetPos = CVector3(position);
	m_TurretTarget = 0;
	m_MinDistance = 10.0f;
	m_State = Inactive;
	m_Timer = 0.0f;

	// Initialise state specific data
	m_PatrolPath = patrolPath;
	m_currentPathPos = 0;
	m_EvadeTargetPos = CVector3(0.0f,0.0f,0.0f);
}

// Utility function, eases into a turn when the angle is less then 90 degrees
TFloat32 CTankEntity::TurnEasing(TFloat32 angle, TFloat32 turnSpeed) {
	if (angle < 1.57079632679) // 90 deg (in radians)
		return sin(angle) * turnSpeed;
	else
		return turnSpeed;
}

bool CTankEntity::Update( TFloat32 updateTime )
{
	// Fetch any messages
	SMessage msg;
	while (Messenger.FetchMessage( GetUID(), &msg ))
	{
		// Set state variables based on received messages
		switch (msg.type) {
			case Msg_Start:
				if (m_State == Inactive)
					m_State = Patrol;
			break;

			case Msg_Stop:
				m_State = Inactive;
			break;

			case Msg_Hit:
				m_HP -= m_TankTemplate->GetShellDamage();
			break;
		}
	}

	// State Speicifc Logic
	CEntity* target;
	CTankEntity* tankTarget;
	CVector3 dist;
	CVector3 decomposedAngles;
	CMatrix4x4 m;
	TFloat32 angle;
	vector<TEntityUID> team;
	switch (m_State) {

		// Slow to a halt in both rotation and forward speed
		case Inactive:
			m_Speed -= m_TankTemplate->GetDeacceleration() * updateTime;
			m_TurretTurnSpeed = 0.0f;

			if (m_TurnSpeed < 0.0f) {
				m_TurnSpeed += m_TankTemplate->GetTurnDeacceleration() * updateTime;
				if (m_TurnSpeed > 0.0f) m_TurnSpeed = 0.0f;
			} else if (m_TurnSpeed > 0.0f) {
				m_TurnSpeed -= m_TankTemplate->GetTurnDeacceleration() * updateTime;
				if (m_TurnSpeed < 0.0f) m_TurnSpeed = 0.0f;
			}
		break;

		//  Move along patrol path and target enemy team
		case Patrol:
			m_Speed += m_TankTemplate->GetAcceleration() * updateTime;
			m_TurretTurnSpeed = 0.5f * m_TankTemplate->GetTurretTurnSpeed();
			
			// target current pos
			m_TargetPos = m_PatrolPath[m_currentPathPos];
			dist = m_TargetPos - Matrix(0).Position();
			if (dist.Length() > m_MinDistance) {
				dist.Normalise();
				angle = acos(dist.Dot(Matrix(0).ZAxis()));
				dist.Dot(Matrix(0).XAxis()) > 0.0f ?
					// Turn Right
					m_TurnSpeed = TurnEasing(angle,m_TankTemplate->GetTurnSpeed()) :
					// Turn Left
					m_TurnSpeed = -TurnEasing(angle, m_TankTemplate->GetTurnSpeed());
			} else {
				// increment patrol path
				++m_currentPathPos;
				if (m_currentPathPos >= m_PatrolPath.size())
					m_currentPathPos = 0;
			}

			team = GetTankUID(m_Team);
			for (unsigned int i = 0; i < team.size(); ++i) {
				target = EntityManager.GetEntity(team[i]);
				if (target != nullptr && target->Template()->GetType() == "Tank") {
						dist = target->Matrix(0).Position() - Matrix(0).Position();
						m = Matrix(0) * Matrix(2);
						dist.Normalise();
						angle = acos(dist.Dot(m.ZAxis()));
						if (angle < 0.261799f) {
							m_TurretTarget = target->GetUID();
							m_State = Aim;
							m_Timer = 1.0f;
						}
				}
			}
			
		break;
		
		// Slow down and take a second to aim at the target before firing
		case Aim:
			// Slow down
			m_Speed -= m_TankTemplate->GetDeacceleration() * updateTime;

			// Slow turn speed
			if (m_TurnSpeed < 0.0f) {
				m_TurnSpeed += m_TankTemplate->GetTurnDeacceleration() * updateTime;
				if (m_TurnSpeed > 0.0f) m_TurnSpeed = 0.0f;
			} else if (m_TurnSpeed > 0.0f) {
				m_TurnSpeed -= m_TankTemplate->GetTurnDeacceleration() * updateTime;
				if (m_TurnSpeed < 0.0f) m_TurnSpeed = 0.0f;
			}

			// Aim turret
			target = EntityManager.GetEntity(m_TurretTarget);
			if (target != nullptr) {
				dist = target->Matrix(0).Position() - Matrix(0).Position();
				m = Matrix(0) * Matrix(2);
				angle = 0.0f;
				dist.Normalise();
				angle = acos(dist.Dot(m.ZAxis()));
				dist.Dot(m.XAxis()) > 0.0f ?
					// Turn Right
					m_TurretTurnSpeed = TurnEasing(angle, m_TankTemplate->GetTurretTurnSpeed()) :
					// Turn Left
					m_TurretTurnSpeed = -TurnEasing(angle, m_TankTemplate->GetTurretTurnSpeed());
			}

			// Countdown timer and fire
			m_Timer -= updateTime;
			if (m_Timer < 0.0f) {
				m_State = Evade;
				// select random evade position
				m_EvadeTargetPos = Matrix().Position() + CVector3(
					static_cast<TFloat32> ( (rand() % 80) - 40),
					0.0f,
					static_cast<TFloat32> (10 + (rand() % 70) - 40)
				);
				EntityManager.CreateShell("Shell Type 1","Shell",Matrix().Position() + CVector3(0.0f,2.0f,0.0f),m.ZAxis(),CVector3(1.0f,1.0f,1.0f),GetTeam());
			}
		break;

		// Drive to evade position then resume regular patrol
		case Evade:
			
			// Speed up
			m_Speed += m_TankTemplate->GetAcceleration() * updateTime;

			// Aim tank toward evade position
			m_TargetPos = m_EvadeTargetPos;
			dist = m_TargetPos - Matrix(0).Position();
			if (dist.Length() > m_MinDistance) {
				dist.Normalise();
				angle = acos(dist.Dot(Matrix(0).ZAxis()));
				dist.Dot(Matrix(0).XAxis()) > 0.0f ?
					// Turn Right
					m_TurnSpeed = TurnEasing(angle, m_TankTemplate->GetTurnSpeed()) :
					// Turn Left
					m_TurnSpeed = -TurnEasing(angle, m_TankTemplate->GetTurnSpeed());
			}
			else {
				m_State = Patrol;
			}

			// Set turret to the facing direction of the tank
			Matrix(2).DecomposeAffineEuler(NULL,&decomposedAngles,NULL);

			decomposedAngles.y > kfPi ?
				// Turn Right
				m_TurretTurnSpeed = TurnEasing(decomposedAngles.y, m_TankTemplate->GetTurnSpeed()) :
				// Turn Left
				m_TurretTurnSpeed = -TurnEasing(decomposedAngles.y, m_TankTemplate->GetTurnSpeed());
		break;
	}
	
	// Clamp tank speed to the range 0 <= speed <= maxSpeed
	m_Speed = Clamp(m_Speed,0.0f,m_TankTemplate->GetMaxSpeed());
	Matrix(0).MoveLocalZ(m_Speed * updateTime);
	Matrix(0).RotateLocalY(m_TurnSpeed * updateTime);
	Matrix(2).RotateLocalY(m_TurretTurnSpeed * updateTime);

	return m_HP > 1; // Destroy if HP is less or equal to zero
}


} // namespace gen
