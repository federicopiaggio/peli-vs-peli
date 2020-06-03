const express = require('express');
const cors = require('cors');
const server = express();
const bodyparser = require('body-parser');
const port = 3200;
const controller = require('./controllers/controller');

server.use(cors());
server.use(bodyparser.urlencoded({ extended: true }));
server.use(bodyparser.json());


server.get('/competencias', controller.getCompetencias);
server.post('/competencias', controller.createCompetencias);
server.delete('/competencias/:id', controller.deleteCompetencias);
server.get('/competencias/:id', controller.getCompetencia);
server.put('/competencias/:id', controller.editCompetencias);
server.get('/competencias/:id/peliculas', controller.getPeliculaRandom);
server.post('/competencias/:id/voto', controller.votar); 
server.delete('/competencias/:id/votos', controller.deleteVotos); 
server.get('/competencias/:id/resultados', controller.getVotodeCompetencia);
server.get('/generos', controller.getAllGeneros);
server.get('/directores', controller.getAllDirectores);
server.get('/actores', controller.getAllActores);

server.listen(port, function(){
    console.log("Listening on port " + port);
});

