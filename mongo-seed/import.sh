mongoimport --host mongodb --db ultimafia --collection usersfire --type json --file accounts.json --jsonArray
mongosh --file ./mongo-init.js