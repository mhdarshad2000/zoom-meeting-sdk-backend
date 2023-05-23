const KJUR = require('jsrsasign');
require('dotenv').config();

const middleware = {};

middleware.generateToken = (req, res, next) => {
    try {
        let signature = "";
        const iat = Math.round(new Date().getTime() / 1000);
        const exp = iat + 60 * 60 *2;
    
        const oHeader = { alg: "HS256", typ: "JWT" };
    
        const sdkSecret = process.env.SDK_SECRET;
        const sdkKey = process.env.SDK_KEY;
        const {topic, password, user_identity, sessionKey, roleType} = req.body;
    
        const oPayload = {
            appKey: sdkKey,
            iat,
            exp,
            tpc: topic,
            pwd: password,
            user_identity: user_identity,
            sessionKey: sessionKey,
            roleType: roleType,
            jti: Math.random().toString(36).substring(7),
        };
        const sHeader = JSON.stringify(oHeader);
        const sPayload = JSON.stringify(oPayload);
        signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);
        res.locals.signature = signature;
        return next()
    } catch (error) {
        return next({error})
    }
   
}

module.exports = middleware;