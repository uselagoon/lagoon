// connect to admin database to create users
db = new Mongo().getDB("admin");
// create admin user
db.createUser({
  user: "root",
  pwd: "password",
  roles: [{
    role: "clusterAdmin",
    db: "admin"
  }]
});