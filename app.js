const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let db = null;
let dbPath = path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPascalToCamel = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
//API 1 all states
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state `;
  const statesArray = await db.all(getAllStatesQuery);
  response.send(
    statesArray.map((eachState) => convertPascalToCamel(eachState))
  );
});

//API 2 state based on state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId}`;
  const state = await db.get(getStateQuery);
  response.send(convertPascalToCamel(state));
});

//API 3 create a district
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `INSERT INTO district(district_name,state_id,
        cases,cured,active,deaths)VALUES('${districtName}','${stateId}','${cases}',
            '${cured}','${active}','${deaths}')`;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4 district based on district Id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId}`;
  const district = await db.get(getDistrictQuery);
  response.send(convertPascalToCamel(district));
});

//API 5 delete district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6 update district based on district Id
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `UPDATE district SET district_name='${districtName}',
    state_id='${stateId}',cases='${cases}',cured='${cured}',active='${active}',
    deaths='${deaths}' WHERE district_id=${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7 get statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT SUM(cases) AS totalCases,
  SUM(cured) AS totalCured, SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
  FROM district WHERE state_id=${stateId}`;
  const stats = await db.get(getStatsQuery);
  response.send({
    totalCases: stats.totalCases,
    totalCured: stats.totalCured,
    totalActive: stats.totalActive,
    totalDeaths: stats.totalDeaths,
  });
});

//API 8 get state name based on district Id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `SELECT state_id FROM district 
    WHERE district_id=${districtId}`;
  const stateIdDetails = await db.get(getStateIdQuery);
  const getStateNameQuery = `SELECT state_name AS stateName FROM state 
    WHERE state_id=${stateIdDetails.state_id}`;
  const state = await db.get(getStateNameQuery);
  response.send(state);
});
module.exports = app;
