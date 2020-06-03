const connection = require('../database/connection');

const controller = {
    getCompetencias: (req, res) => {
        connection.query(
            'SELECT * FROM competencias',
            (error, competencias, fields) => {
                res.json(competencias);
            }
        );
    },

    getCompetencia: (req, res) => {
        let idCompetencia = req.params.id;
        
        let sql = ' SELECT competencias.nombre, genero.nombre as genero_nombre, actor.nombre as actor_nombre, director.nombre as director_nombre FROM competencias' +
                  ' LEFT JOIN genero ON competencias.genero_id = genero.id ' +
                  ' LEFT JOIN actor  ON competencias.actor_id = actor.id ' +
                  ' LEFT JOIN director ON competencias.director_id = director.id ' +
                  ' WHERE competencias.id = ? ';

        connection.query(
            sql,
            [idCompetencia],
            
            (error, competencias, fields) => {
                res.json(competencias[0]);
            }
        );
    },

    getPeliculaRandom: (req, res) => {
        let idCompetencia = parseInt(req.params.id);

        connection.query(
            'SELECT * FROM competencias WHERE id = ?',
            [idCompetencia],
            (error, competencias, fields) => {
                if (error) return console.error(error);
                if (!competencias.length) return res.status(404).send();

                let competencia = competencias[0];
                let PeliculasQuery = 'SELECT p.id, p.titulo, p.poster FROM pelicula p ' + 
                'JOIN director_pelicula dp ON dp.pelicula_id = p.id ' + 
                'JOIN actor_pelicula ap ON ap.pelicula_id = p.id ';
                let queryParams = []

                if(competencia.genero_id){
                    PeliculasQuery += ' WHERE p.genero_id = ? ';
                    queryParams.push(competencia.genero_id);
                }

                if(competencia.director_id){
                    if(queryParams.length){
                        PeliculasQuery += ' AND ';
                    } else {
                        PeliculasQuery += ' WHERE ';
                    }
                    PeliculasQuery += ' dp.director_id = ? ';
                    queryParams.push(competencia.director_id);
                }

                if(competencia.actor_id){
                    if(queryParams.length){
                        PeliculasQuery += ' AND ';
                    } else {
                        PeliculasQuery += ' WHERE ';
                    }
                    PeliculasQuery += ' ap.actor_id =  ?';
                    queryParams.push(competencia.actor_id);

                }

                PeliculasQuery += ' ORDER BY RAND() LIMIT 2';

                connection.query(
                    PeliculasQuery,
                    queryParams,
                    (error, peliculas, fields) => {
                        if (error) return console.error(error);
                        if (!peliculas.length) return res.status(404).send();

                        res.json({ 
                            competencia: competencia.nombre, 
                            peliculas: peliculas 
                        });
                    }
                )

            }
        )
    },

    votar: (req, res) => {
    if (!req.params.id || isNaN(req.params.id)) return res.status(400).send('Competencia inválida');
    if (!req.body) return res.status(400).send('Consulta inválida');

    let idCompetencia = req.params.id;
    
    connection.query(
        'SELECT * FROM competencias',
        (error, competencias, fields) => {
            if (error) return console.error(error);
            if (!competencias.length) return res.status(404).send("La competencia seleccionada no existe");
            
            let idPelicula = req.body.idPelicula;
                    
            connection.query(
                'INSERT INTO votos (competencia_id, pelicula_id) VALUES (?,?)',
                [idCompetencia, idPelicula],
                (error, results, fields) => {
                    
                    if (error) console.error(error);
                    if (!req.body) return res.status(400).send();
                    res.status(201).json({message: 'ok votos'});
                }
            );
            
        }
    )

    },

    getVotodeCompetencia: (req, res) => {
        if (!req.params.id || isNaN(req.params.id)) return res.status(400).send('Competencia inválida');

        let idCompetencia = parseInt(req.params.id);

        connection.query(
            'SELECT * FROM competencias WHERE id = ?',
            [idCompetencia],
            (error, competencias, fields) => {
                if (error) return console.error(error);
                if (!competencias.length) return res.status(404).send("La competencia seleccionada no existe");

                connection.query(
                    'SELECT p.id, p.titulo, p.poster, votos.votos FROM ' +
                        '(SELECT v.competencia_id, v.pelicula_id, SUM(1) votos ' +
                        'FROM votos v  ' +
                        'WHERE v.competencia_id = ? ' +
                        'GROUP BY v.pelicula_id, v.competencia_id) votos ' +
                    'JOIN pelicula p on pelicula_id = p.id ' +
                    'ORDER BY votos.votos DESC LIMIT 3;',
                    [idCompetencia],
                    (error, votos, fields) => {
                        if (error) return console.error(error);

                        res.json({
                            competencia : competencias[0].nombre,
                            resultados : votos
                        })
                    }
                );

            }
        )
    },

    createCompetencias: (req, res) => {
        if (!req.body) return res.status(400).send('Consulta inválida');

        let nombreCompetencia = req.body.nombre;
        if (!nombreCompetencia) return res.status(400).send("El nombre de la competencia es obligatorio");

        connection.query(
            'SELECT nombre FROM competencias',
            (error, competencias, fields) => {
            
                if (error) return console.error(error);
                
                let generoCompetencia = req.body.genero;
                let directorCompetencia = req.body.director;
                let actorCompetencia = req.body.actor;
                let insertInto = "INSERT INTO competencias "
                let insertParams = [];

                let selectQuery = "SELECT COUNT(1) cantidad_peliculas FROM pelicula p " +
                "JOIN actor_pelicula ap ON ap.pelicula_id = p.id " + 
                "JOIN director_pelicula dp ON dp.pelicula_id = p.id ";
                let selectParams = [];


                if(actorCompetencia > 0 && directorCompetencia > 0){
                    insertInto += "(nombre, genero_id, director_id, actor_id) VALUES (?, ?, ?, ?);";
                    insertParams.push(nombreCompetencia, generoCompetencia, directorCompetencia, actorCompetencia);
                    selectQuery += " WHERE ap.actor_id = ? AND dp.director_id = ?";
                    selectParams.push(actorCompetencia, directorCompetencia);
                } 

                else if (generoCompetencia > 0 && directorCompetencia > 0) {
                    insertInto += "(nombre, genero_id, director_id) VALUES (?, ?, ?);";
                    insertParams.push(nombreCompetencia, generoCompetencia, directorCompetencia);
                    selectQuery += " WHERE p.genero_id = ? AND dp.director_id = ?";
                    selectParams.push(generoCompetencia, directorCompetencia);
                }

                else if(generoCompetencia > 0 && actorCompetencia > 0){
                    insertInto += "(nombre, genero_id, actor_id) VALUES (?, ?, ?);";
                    insertParams.push(nombreCompetencia, generoCompetencia, actorCompetencia);
                    selectQuery += " WHERE p.genero_id = ? AND ap.actor_id = ?";
                    selectParams.push(generoCompetencia, actorCompetencia);
                }

                else if(directorCompetencia > 0){
                    insertInto += "(nombre, director_id) VALUES (?, ?);";
                    insertParams.push(nombreCompetencia, directorCompetencia);
                    selectQuery += " WHERE dp.director_id = ?";
                    selectParams.push(directorCompetencia);
                }

                else if(actorCompetencia > 0){
                    insertInto += "(nombre, actor_id) VALUES (?, ?);";
                    insertParams.push(nombreCompetencia, actorCompetencia);
                    selectQuery += " WHERE ap.actor_id = ?";
                    selectParams.push(actorCompetencia);
                }
                
                else if(generoCompetencia > 0){
                    insertInto += "(nombre, genero_id) VALUES (?, ?);";
                    insertParams.push(nombreCompetencia, generoCompetencia);
                    selectQuery += " WHERE p.genero_id = ?";
                    selectParams.push(generoCompetencia);

                }
                
                else if(generoCompetencia > 0 && actorCompetencia > 0 && directorCompetencia > 0){
                    insertInto += "(nombre, genero_id, director_id, actor_id) VALUES (?, ?, ?, ?);";
                    insertParams.push(nombreCompetencia, generoCompetencia, directorCompetencia, actorCompetencia);
                    selectQuery += " WHERE p.genero_id = ? AND ap.actor_id = ? AND dp.director_id = ?";
                    selectParams.push(generoCompetencia, actorCompetencia, directorCompetencia);
                } 
                
                else {
                    return res.status(422).send("Al menos una condición es obligatorio");
                }

                connection.query(
                    selectQuery,
                    selectParams,
                    (error, results, fields) => {
                        if (error) return console.error(error);
                        if (results[0].cantidad_peliculas < 2) return res.status(422).json("No hay dos películas que cumplan esa condición");
                        else{   
                            connection.query(
                            insertInto,
                            insertParams,
                            (error, results, fields) => {
                                if(error) return console.error(error);
                                res.json(results);
                                }
                            );
                        }
                    }
                )
            }
        );
    },

    deleteVotos: (req, res) => {
        if (!req.params.id || isNaN(req.params.id)) return res.status(400).send('Competencia inválida');
    
        let idCompetencia = req.params.id;
    
        connection.query(
            'DELETE FROM votos WHERE competencia_id = ?',
            [idCompetencia],
            (error, competencia, fields) => {
                if (error) return console.error(error);
                if (competencia.length === 0) return res.status(404).send("La competencia seleccionada no existe");

                res.status(205).send("Reiniciado los votos");
            }
        );
    },

    getAllGeneros: (req, res) => {
        connection.query(
            'SELECT * FROM genero;',
            (error, generos, fields) => {
                if(error) return console.error(error);
                res.json(generos);
            }
        );
    },

    getAllDirectores: (req, res) => {
        connection.query(
            'SELECT * FROM director;',
            (error, director, fields) => {
                if(error) return console.error(error);
                res.json(director);
            }
        );
    },

    getAllActores: (req, res) => {
        connection.query(
            'SELECT * FROM actor;',
            (error, actor, fields) => {
                if(error) return console.error(error);
                res.json(actor);
            }
        );
    },

    deleteCompetencias: (req, res) => {
        if (!req.params.id || isNaN(req.params.id)) return res.status(400).send('Competencia inválida');
    
        let idCompetencia = parseInt(req.params.id);
 
        connection.query(
            'DELETE FROM votos WHERE competencia_id = ?',
            [idCompetencia],
            (error, results, fields) => {
                if (error) return console.error(error);
                
                connection.query(
                    'DELETE FROM competencias WHERE id = ?',
                    [idCompetencia],
                    (error, competencia, fields) => {
                        if (error) return console.error(error);
                        if (competencia.affectedRows === 0) return res.status(404).send("La competencia seleccionada no existe");
        
                        return res.json({ message: "La competencia se ha eliminado"});
                        
                    }
                )
            }
        );
    },

    editCompetencias: (req, res) => {
        let idCompetencia = req.params.id;
        let nombreNuevo = req.body.nombre;
        connection.query(
            'UPDATE competencias SET nombre = ? WHERE id = ?',
            [nombreNuevo, idCompetencia],
            (error, results, fields) => {
                if (error) return console.error(error);
                
                res.status(200).send();
            }
        );
    }
}

module.exports = controller;
