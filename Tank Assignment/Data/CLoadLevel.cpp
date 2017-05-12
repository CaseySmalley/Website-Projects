#include <string>
#include "CLoadLevel.h"

gen::CEntityManager* EntityManager;

vector<gen::TEntityUID> CLoadLevel::m_teamA;
vector<gen::TEntityUID> CLoadLevel::m_teamB;

bool CLoadLevel::getFileContents(std::string filePath,vector<Json> &jsonArray) {
	// Retreives file content using a stream, places it into a std::string using iterators and then it is passed to serialise a Json object
	std::ifstream rawFile{ filePath };
	std::string fileContents{ std::istreambuf_iterator<char>(rawFile), std::istreambuf_iterator<char>() };
	std::string errorMessage = "";
	vector<Json> temp = Json::parse(fileContents, errorMessage).array_items(); // Requires a second std::string to serve as a error message	
	
	for (unsigned int i = 0; i < temp.size(); ++i) {
		jsonArray.push_back(temp[i]);
	}
	
	return errorMessage.empty(); 
}

// Setters
void CLoadLevel::setEntityManager(gen::CEntityManager* _EntityManager) {
	EntityManager = _EntityManager;
}

// Getters
vector<gen::TEntityUID> CLoadLevel::getTeamA() {
	return m_teamA;
}

vector<gen::TEntityUID> CLoadLevel::getTeamB() {
	return m_teamB;
}

// Load Entity Templates from Json file
bool CLoadLevel::loadTemplates(std::string filePath) {
	vector<Json> rawTemplate;

	// Early return if the file failed to parse
	 if (!getFileContents(filePath,rawTemplate))
		return false;

	// Template setup
	for (unsigned int i = 0; i < rawTemplate.size(); ++i) {

		if (rawTemplate[i]["type"].string_value() == "Scenery") 
			EntityManager->CreateTemplate(
				rawTemplate[i]["type"].string_value(),
				rawTemplate[i]["name"].string_value(),
				rawTemplate[i]["mesh"].string_value()
			);
		
		if (rawTemplate[i]["type"].string_value() == "Projectile")
			EntityManager->CreateTemplate(
				rawTemplate[i]["type"].string_value(),
				rawTemplate[i]["name"].string_value(),
				rawTemplate[i]["mesh"].string_value()
			);
		
		if (rawTemplate[i]["type"].string_value() == "Tank")
			EntityManager->CreateTankTemplate(
				rawTemplate[i]["type"].string_value(),
				rawTemplate[i]["name"].string_value(),
				rawTemplate[i]["mesh"].string_value(),
				rawTemplate[i]["maxSpeed"].number_value(),
				rawTemplate[i]["acceleration"].number_value(),
				rawTemplate[i]["deacceleration"].number_value(),
				rawTemplate[i]["turnSpeed"].number_value(),
				rawTemplate[i]["turnAcceleration"].number_value(),
				rawTemplate[i]["turnDeacceleration"].number_value(),
				rawTemplate[i]["turretTurnSpeed"].number_value(),
				rawTemplate[i]["maxHP"].number_value(),
				rawTemplate[i]["shellDamage"].number_value()
			);

	}

	return true;
}

bool CLoadLevel::loadScene(std::string filePath) {
	vector<Json> rawScene;

	// Early return if the file failed to parse
	if (!getFileContents(filePath,rawScene))
		return false;

	for (unsigned int i = 0; i < rawScene.size(); ++i) {
		
		// Scenery setup
		if (rawScene[i]["type"].string_value() == "Scenery")
			EntityManager->CreateEntity(
				rawScene[i]["templateName"].string_value(),
				rawScene[i]["name"].string_value(),
				gen::CVector3(
					rawScene[i]["pos_x"].number_value(),
					rawScene[i]["pos_y"].number_value(),
					rawScene[i]["pos_z"].number_value()
				),
				gen::CVector3(
					rawScene[i]["rot_x"].number_value(),
					rawScene[i]["rot_y"].number_value(),
					rawScene[i]["rot_z"].number_value()
				),
				gen::CVector3(
					rawScene[i]["scale_x"].number_value(),
					rawScene[i]["scale_y"].number_value(),
					rawScene[i]["scale_z"].number_value()
				)
			);

		// Tank setup
		if (rawScene[i]["type"].string_value() == "tank") {
			
			// Gather patrol points into a new vector before passing
			vector<Json> rawPatrolPath = rawScene[i]["patrolPath"].array_items();
			vector<gen::CVector3> patrolPath;
			for (unsigned int j = 0; j < rawPatrolPath.size(); ++j) {
				patrolPath.push_back(gen::CVector3(
					static_cast<gen::TFloat32> (rawPatrolPath[j]["pos_x"].number_value()),
					static_cast<gen::TFloat32> (rawPatrolPath[j]["pos_y"].number_value()),
					static_cast<gen::TFloat32> (rawPatrolPath[j]["pos_z"].number_value())
				));
			}
			
			gen::TEntityUID tempUID = EntityManager->CreateTank(
				patrolPath,
				rawScene[i]["templateName"].string_value(),
				static_cast<gen::TInt32> (rawScene[i]["team"].number_value()),
				rawScene[i]["name"].string_value(),
				gen::CVector3(
					static_cast<gen::TFloat32> (rawScene[i]["pos_x"].number_value()),
					static_cast<gen::TFloat32> (rawScene[i]["pos_y"].number_value()),
					static_cast<gen::TFloat32> (rawScene[i]["pos_z"].number_value())
				),
				gen::CVector3(
					static_cast<gen::TFloat32> (rawScene[i]["rot_x"].number_value()),
					static_cast<gen::TFloat32> (rawScene[i]["rot_y"].number_value()),
					static_cast<gen::TFloat32> (rawScene[i]["rot_z"].number_value())
				)
			);

			// Place into team list
			if (static_cast<gen::TInt32> (rawScene[i]["team"].number_value()) == 0)
				m_teamA.push_back(tempUID);
			else if (static_cast<gen::TInt32> (rawScene[i]["team"].number_value()) == 1)
				m_teamB.push_back(tempUID);
		}
	}

	return true;
}