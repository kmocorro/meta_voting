let jwt = require('jsonwebtoken');
let config = require('../config').authSecret;
let uuidv4 = require('uuid/v4');

/**
 * 
 * @param {userID, claim} req 
 *  
 */
function verifyToken(req, res, next){
    let token = req.cookies.auth_ert_voting_login_cookie;
    
    if(!token){

        let authenticity_token = jwt.sign({
            id: uuidv4(),
            claim: {
                signup: 'valid'
            }
        }, config.secret, { expiresIn: 300 });

        return res.render('login', {authenticity_token});

    } else {

        jwt.verify(token, config.secret, function(err, decoded){

            if(err){
                
                let authenticity_token = jwt.sign({id: uuidv4(), claim:{ signup: 'valid'}}, config.secret, {expiresIn:300});
                return res.status(200).render('login', {authenticity_token});

            } else {

                req.userID = decoded.id;
                req.claim = decoded.claim;
                next();

            }

        });
    }
}

module.exports = verifyToken;