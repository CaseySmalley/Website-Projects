#pragma once

#include <fstream>
#include "EntityManager.h"
#include "json11.hpp"

using namespace json11;

class CLoadLevel {
	private:
		static vector<gen::TEntityUID> m_teamA;
		static vector<gen::TEntityUID> m_teamB;
		static bool getFileContents(std::string filePath,vector<Json> &jsonArray);
	public:
		static vector<gen::TEntityUID> getTeamA();
		static vector<gen::TEntityUID> getTeamB();
		static void setEntityManager(gen::CEntityManager* _EntityManager);
		static bool loadTemplates(std::string filePath);
		static bool loadScene(std::string filePath);
};