let formidable = require('formidable');
let XLSX = require('xlsx');
let moment = require('moment');
let mysql = require('../config').pool;
let uuidv4 = require('uuid/v4');
let jwt = require('jsonwebtoken');


let config = require('../config').authSecret;
let verifyToken = require('../controllers/verifyToken');


module.exports = function(app){

    /** routes */
    app.get('/login', function(req, res){

        let authenticity_token = jwt.sign({
            id: uuidv4(),
            claim: {
                signup: 'valid'
            }
        }, config.secret);

        res.render('login', {authenticity_token});
    });

    app.get('/logout', function(req, res){
        res.cookie('auth_ert_voting_login_cookie', null);
        res.redirect('/');
    });

    app.get('/', verifyToken, function(req, res){
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        if(req.userID && req.claim){

            let authenticity_token = jwt.sign({
                id: uuidv4(),
                claim: {
                    signup: 'valid'
                }
            }, config.secret);

            let user_details = {
                employeeNumber: req.claim.employeeNumber,
                username: req.claim.username,
                displayName: req.claim.displayName,
                givenName: req.claim.givenName,
                title: req.claim.title,
                department: req.claim.department
            }

            let page_details = {
                header_title: 'Home | META',
                sidebar_title: 'Voting App',
                initial: 'MVA',
                company: 'META',
                footer: 'META Voting App',
                welcome_message: 'Let\'s vote for the best employee representative for EHS Steering Comittee.',
                version: '1.0.0'
            }

            /** check voters_data */
            function getVoters_data(){
                return new Promise(function(resolve, reject){

                    mysql.getConnection(function(err, connection){
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'SELECT * FROM voters_data WHERE employee_number = ?',
                            values: [user_details.employeeNumber]
                        },  function(err, results){
                            if(err){return reject(err)};

                            if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0 ){
                                let isVoted = true;
                                resolve(isVoted);
                            } else {
                                let isVoted = false;
                                resolve(isVoted);
                            }

                        });

                        connection.release();

                    });

                });
            }

            /** Voter's details */
            function getVoter_details(){ // actually shift details lol
                return new Promise(function(resolve, reject){

                    mysql.getConnection(function(err, connection){
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'SELECT * FROM employee_list WHERE upload_date = (SELECT MAX(upload_date) FROM employee_list) AND employee_number = ?',
                            values: [user_details.employeeNumber]
                        },  function(err, results){
                            if(err){return reject(err)};

                            if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){

                                let user_shift_details = {
                                    employee_number: results[0].employee_number,
                                    lastname: results[0].lastname,
                                    firstname: results[0].firstname,
                                    employment_date: results[0].employment_date,
                                    business_title: results[0].business_title,
                                    shift: results[0].shift,
                                    upload_date: results[0].upload_date
                                }

                                resolve(user_shift_details);
                            } else {
                                reject();
                            }
                            
                        });

                        connection.release();

                    });

                });
            }

            getVoters_data().then(function(isVoted){
                if(!isVoted){

                    getVoter_details().then(function(user_shift_details){

                        /** Candidate's details from uploaded file... */
                        function getCandidates_list(){ // this depends on voter's shift..
                            return new Promise(function(resolve, reject){
        
                                // contemplating if I should put candidate's list in the database or in local path folder...
                                // answer, I have to put candidate's info in the database for me to verify if it's a valid vote before accepting the count...
                                
                                if(user_shift_details.shift == 'E'){ // display all shift.
        
                                    mysql.getConnection(function(err, connection){
                                        if(err){return reject(err)};
            
                                        connection.query({
                                            sql: 'SELECT * FROM candidate_list WHERE upload_date = (SELECT MAX(upload_date) FROM candidate_list)',
                                        },  function(err, results){
                                            if(err){return reject(err)};
            
                                            let candidate_list_array = [];
            
                                            if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0 ){
        
                                                for(let i=0; i<results.length; i++){
            
                                                    candidate_list_array.push({
                                                        cid: results[i].cid,
                                                        employee_number: results[i].employee_number,
                                                        candidate_name: results[i].candidate_name,
                                                        shift: results[i].shift,
                                                        business_title: results[i].business_title,
                                                        upload_date: results[i].upload_date
                                                    });
            
                                                }
        
                                                resolve(candidate_list_array);
                                                
            
                                            } else {
            
                                                resolve(candidate_list_array);
            
                                            }
                                            
                                        });
            
                                        connection.release();
                                    });
        
                                } else { // depends on user shift...
        
                                    mysql.getConnection(function(err, connection){
                                        if(err){return reject(err)};
            
                                        connection.query({
                                            sql: 'SELECT * FROM candidate_list WHERE upload_date = (SELECT MAX(upload_date) FROM candidate_list) AND shift = ? OR shift = "E" OR shift = "F"',
                                            values: [user_shift_details.shift]
                                        },  function(err, results){
                                            if(err){return reject(err)};
            
                                            let candidate_list_array = [];
            
                                            if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0 ){
            
                                                for(let i=0; i<results.length; i++){
            
                                                    candidate_list_array.push({
                                                        cid: results[i].cid,
                                                        employee_number: results[i].employee_number,
                                                        candidate_name: results[i].candidate_name,
                                                        shift: results[i].shift,
                                                        business_title: results[i].business_title,
                                                        upload_date: results[i].upload_date
                                                    });
            
                                                }
            
                                                resolve(candidate_list_array);
            
                                            } else {
            
                                                resolve(candidate_list_array);
            
                                            }
                                            
                                        });
            
                                        connection.release();
                                    });
                                }
        
                            });
                        }
        
                        return getCandidates_list().then(function(candidate_list){
                            
                            res.render('index', {authenticity_token, user_details, page_details, candidate_list});
        
                        }, function(err){
        
                            let candidate_list = [];
                            
                            res.render('index', {authenticity_token, user_details, page_details, candidate_list});
        
                        });
        
                    },  function(err){
                        res.send({err: 'Error verifying account... ' + err});
                    });

                } else {

                    getVoter_details().then(function(user_shift_details){
                        let candidate_list = [];

                        function voted_candidate(){
                            return new Promise(function(resolve, reject){

                                mysql.getConnection(function(err, connection){

                                    if(err){return reject(err)};

                                    connection.query({
                                        sql: 'SELECT * FROM voters_data a JOIN candidate_list b ON a.candidate_employee_number = b.employee_number WHERE a.employee_number = ?',
                                        values: [user_shift_details.employee_number]
                                    },  function(err, results){
                                        if(err){return reject(err)};

                                        if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0 ){
                                            let voted_data_obj = {
                                                cid: results[0].cid,
                                                employee_number: results[0].employee_number,
                                                candidate_employee_number: results[0].candidate_employee_number,
                                                vote_dt: moment(results[0].vote_dt).calendar(),
                                                candidate_name: results[0].candidate_name,
                                                shift: results[0].shift,
                                                business_title: results[0].business_title
                                            }

                                            resolve(voted_data_obj);
                                        } 

                                    });

                                    connection.release();

                                });

                            });
                        }

                        return voted_candidate().then(function(voted_data_obj){

                            let page_details = {
                                header_title: 'Home | META',
                                sidebar_title: 'Voting App',
                                initial: 'MVA',
                                company: 'META',
                                footer: 'META Voting App',
                                welcome_message: 'You have already voted.',
                                version: '1.0.0'
                            }

                            res.render('index', {authenticity_token, user_details, page_details, candidate_list, voted_data_obj});

                        });

                    },  function(err){
                        let candidate_list = [];
                        
                        res.render('index', {authenticity_token, user_details, page_details, candidate_list});
                    });
                }
            });

        }

    });

    /** vote link */
    app.get('/vote', verifyToken, function(req, res){
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        let authenticity_token = jwt.sign({
            id: uuidv4(),
            claim: {
                signup: 'valid'
            }
        }, config.secret);

        let user_details = {
            employeeNumber: req.claim.employeeNumber,
            username: req.claim.username,
            displayName: req.claim.displayName,
            givenName: req.claim.givenName,
            title: req.claim.title,
            department: req.claim.department,
            isAdmin: req.claim.isAdmin
        }

        let page_details = {
            header_title: 'Home | META',
            sidebar_title: 'Voting App',
            initial: 'MVA',
            company: 'META',
            footer: 'META Voting App',
            welcome_message: '',
            reminders: '',
            version: '1.0.0'
        }

        if(req.query.cid && req.query.employee_number){

            let candidate_id = req.query.cid;
            let candidate_employee_number = req.query.employee_number;
            let auth_token = req.query.authenticity_token;

            // need to verify and validate candidate id from the database... and get candidate's info...
            function getCandidate_data(){
                return new Promise(function(resolve, reject){

                    mysql.getConnection(function(err, connection){
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'SELECT * FROM candidate_list WHERE upload_date = (SELECT MAX(upload_date) FROM candidate_list) AND cid = ? AND employee_number = ?',
                            values: [candidate_id, candidate_employee_number]
                        },  function(err, results){
                            if(err){return reject(err)};

                            if(typeof results[0] !== 'undefined' && results[0] !== null && results.length > 0){

                                let user_wants_to_vote = {
                                    cid: results[0].cid,
                                    candidate_employee_number: results[0].employee_number,
                                    candidate_name: results[0].candidate_name,
                                    shift: results[0].shift,
                                    business_title: results[0].business_title
                                }

                                resolve(user_wants_to_vote);
                            } else {

                                reject('Sorry, candidate does not exists.');

                            }
                            
                        });

                        connection.release();

                    });

                });
            }

            getCandidate_data().then(function(user_wants_to_vote){

                res.render('vote', {authenticity_token, user_details, page_details, user_wants_to_vote});

            },  function(err){
                
                res.send({err: err});
            });

        }

    });

    /** record vote */
    app.get('/thankyou', verifyToken, function(req, res){
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        
        if( req.query.authenticity_token && req.query.cid && req.query.candidate_employee_number && req.query.voters_employee_number){

            let auth_token = req.query.authenticity_token;
            let cid = req.query.cid;
            let candidate_employee_number = req.query.candidate_employee_number;
            let voters_employee_number = req.query.voters_employee_number;
            let vote_dt = new Date();

            // verify token
            function verifyLinkToken(){
                return new Promise(function(resolve, reject){

                    jwt.verify(auth_token, config.secret, function(err, decoded){
                        if(err){ return reject(err)};

                        resolve();

                    });

                });
            }

            /** insert to db */
            function insertToVoters_Data(){
                return new Promise(function(resolve, reject){
                    
                    mysql.getConnection(function(err, connection){
                        if(err){return reject(err)};

                        connection.query({
                            sql: 'INSERT INTO voters_data SET employee_number = ?, cid = ?, candidate_employee_number = ?, vote_dt = ?',
                            values: [voters_employee_number, cid, candidate_employee_number, vote_dt]
                        },  function(err, results){
                            if(err){reject(err)};

                            if(results){
                                resolve();
                            }

                        });
                        
                        connection.release();

                    });
                    
                });
            }

            verifyLinkToken().then(function(){
                insertToVoters_Data().then(function(){
                    
                    res.cookie('auth_ert_voting_login_cookie', null);
                    res.render('thankyou');

                });
            });

            
        }

    });

    app.get('/upload-employee-list', verifyToken, function(req, res){
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        if(req.userID && req.claim){

            let authenticity_token = jwt.sign({
                id: uuidv4(),
                claim: {
                    signup: 'valid'
                }
            }, config.secret);

            let user_details = {
                username: req.claim.username,
                displayName: req.claim.displayName,
                givenName: req.claim.givenName,
                title: req.claim.title,
                department: req.claim.department
            }

            let page_details = {
                header_title: 'Home | META',
                sidebar_title: 'Voting App',
                initial: 'MVA',
                company: 'META',
                footer: 'META Voting App',
                welcome_message: 'Update the employee list below by uploading employeeList.xlsx',
                version: '1.0.0'
            }

            res.render('upload_emplist', {authenticity_token, user_details, page_details});


        }
        
    });

    app.get('/upload-candidate-list', verifyToken, function(req, res){
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');

        if(req.userID && req.claim){

            let authenticity_token = jwt.sign({
                id: uuidv4(),
                claim: {
                    signup: 'valid'
                }
            }, config.secret);

            let user_details = {
                username: req.claim.username,
                displayName: req.claim.displayName,
                givenName: req.claim.givenName,
                title: req.claim.title,
                department: req.claim.department
            }

            let page_details = {
                header_title: 'Home | META',
                sidebar_title: 'Voting App',
                initial: 'MVA',
                company: 'META',
                footer: 'META Voting App',
                welcome_message: 'Update the employee list below by uploading candidateList.xlsx',
                version: '1.0.0'
            }

            res.render('upload_candidatelist', {authenticity_token, user_details, page_details});


        }
        
    });
    
    /** post for admin update employee list */
    app.post('/api/employeeList', verifyToken, function(req, res){

        let form = new formidable.IncomingForm();

        let user_details = {
            username: req.claim.username,
            displayName: req.claim.displayName,
            givenName: req.claim.givenName,
            title: req.claim.title,
            department: req.claim.department,
            isAdmin: req.claim.isAdmin
        }

        form.maxFileSize = 2 * 1024 * 1024; // max size 2MB. we can adjust this later ;)

        form.parse(req, function(err, fields, file){
            
            if(err){return res.send({err: '<span class="fa fa-times" style="color: red;"></span> Invalid file. ' + err})};

            if(file){
                let excelFile = {
                    date_upload: new Date(),
                    path: file.upload_form.path,
                    name: file.upload_form.name,
                    type: file.upload_form.type,
                    date_modified: file.upload_form.lastModifiedDate
                }

                let workbook = XLSX.readFile(excelFile.path);
                
                let emp_list_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['emp_list'], {header: 'A'});
                let cleaned_emp_list = [];

                let upload_date = new Date();

                // cleaning workbook sheets emp list.
                for(let i=1; i<emp_list_Worksheet.length; i++){

                    if(emp_list_Worksheet[i].A){

                        cleaned_emp_list.push(

                            [emp_list_Worksheet[i].A,
                            emp_list_Worksheet[i].B,
                            emp_list_Worksheet[i].C,
                            new Date((emp_list_Worksheet[i].D - (25567 + 2))*86400*1000), // im doing this because excel serialized the date
                            emp_list_Worksheet[i].E,
                            emp_list_Worksheet[i].F,
                            upload_date]
    
                        );
                    }

                }

                // bulk insert thanks to dada! wohoo.
                function insertToEmployeeList(){
                    return new Promise(function(resolve, reject){

                        mysql.getConnection(function(err, connection){
                            if(err){ return reject('Connection error') };

                            connection.query({
                                sql: 'INSERT INTO employee_list (employee_number, lastname, firstname, employment_date, business_title, shift, upload_date) VALUES ?',
                                values: [cleaned_emp_list]
                            },  function(err, results){
                                if(err){ return reject(err) };

                                resolve(results.insertID);
                            });

                            connection.release();
                            
                        });     
                        
                    });

                }

                insertToEmployeeList().then(function(){
                    
                    res.send({auth:'<span class="fa fa-check" style="color: green;"></span> Successfully uploaded'});
                },  function(err){

                    res.send({err: '<span class="fa fa-times" style="color: red;"></span> Invalid format ' + err});
                });

            } else {
                res.send({err: '<span class="fa fa-times" style="color: red;"></span> Invalid file. ' + err});
            }

        });

    });

    /** post for admin update candidate list */
    app.post('/api/candidateList', verifyToken, function(req, res){

        let form = new formidable.IncomingForm();

        let user_details = {
            username: req.claim.username,
            displayName: req.claim.displayName,
            givenName: req.claim.givenName,
            title: req.claim.title,
            department: req.claim.department,
            isAdmin: req.claim.isAdmin
        }

        form.maxFileSize = 2 * 1024 * 1024; // max size 2MB. we can adjust this later ;)

        form.parse(req, function(err, fields, file){
            
            if(err){return res.send({err: '<span class="fa fa-times" style="color: red;"></span> Invalid file. ' + err})};

            if(file){
                let excelFile = {
                    date_upload: new Date(),
                    path: file.upload_form.path,
                    name: file.upload_form.name,
                    type: file.upload_form.type,
                    date_modified: file.upload_form.lastModifiedDate
                }

                let workbook = XLSX.readFile(excelFile.path);
                
                let candidate_list_Worksheet = XLSX.utils.sheet_to_json(workbook.Sheets['candidate_list'], {header: 'A'});
                let cleaned_candidate_list = [];

                let upload_date = new Date();

                // cleaning workbook sheets emp list.
                for(let i=1; i<candidate_list_Worksheet.length; i++){

                    if(candidate_list_Worksheet[i].A){

                        cleaned_candidate_list.push(

                            [candidate_list_Worksheet[i].A,
                            candidate_list_Worksheet[i].B,
                            candidate_list_Worksheet[i].C,
                            candidate_list_Worksheet[i].E,
                            upload_date,
                            candidate_list_Worksheet[i].D,]
    
                        );
                    }

                }

                // bulk insert thanks to dada! wohoo.
                function insertToCandidateList(){
                    return new Promise(function(resolve, reject){

                        mysql.getConnection(function(err, connection){
                            if(err){ return reject('Connection error') };

                            connection.query({
                                sql: 'INSERT INTO candidate_list (cid, employee_number, candidate_name, shift, upload_date, business_title) VALUES ?',
                                values: [cleaned_candidate_list]
                            },  function(err, results){
                                if(err){ return reject(err) };

                                resolve(results.insertID);
                            });

                            connection.release();
                            
                        });     
                        
                    });

                }

                insertToCandidateList().then(function(){
                    
                    res.send({auth:'<span class="fa fa-check" style="color: green;"></span> Successfully uploaded'});
                },  function(err){

                    res.send({err: '<span class="fa fa-times" style="color: red;"></span> Invalid format '});
                });

            } else {
                res.send({err: '<span class="fa fa-times" style="color: red;"></span> Invalid file. ' + err});
            }

        });

    });
}