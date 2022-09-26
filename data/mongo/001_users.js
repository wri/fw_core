db.createUser({
  user: "admin",
  pwd: "password",
  roles: [
    {
      role: "readWrite",
      db: "fw_teams_db"
    }
  ]
});

// Test Database
db = db.getSiblingDB("fw_teams_db_test");
db.createUser({
  user: "admin",
  pwd: "password",
  roles: [
    {
      role: "readWrite",
      db: "fw_teams_db_test"
    }
  ]
});
