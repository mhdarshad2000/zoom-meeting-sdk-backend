require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const KJUR = require("jsrsasign");
const axios = require("axios");
const {Buffer} = require("buffer");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.use(bodyParser.json());

app.post("/oauth", async (req, res) => {
  try {
    const b = Buffer.from(
      process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
    );
    const { data } = await axios(
      `https://zoom.us/oauth/token?grant_type=authorization_code&code=${req.body.code}&redirect_uri=${process.env.REDIRECT_URL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${b.toString("base64")}`,
        },
      }
    );

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  } catch (e) {
    return res.status(500).json(e.message);
  }
});

app.post("/", async (req, res) => {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: "HS256", typ: "JWT" };
  console.log(req.body);

  const oPayload = {
    sdkKey: process.env.ZOOM_MEETING_SDK_KEY,
    appKey: process.env.ZOOM_MEETING_SDK_KEY,
    mn: req.body.meetingNumber,
    role: req.body.role,
    iat: iat,
    exp: exp,
    tokenExp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const signature =await KJUR.jws.JWS.sign(
    "HS256",
    sHeader,
    sPayload,
    process.env.ZOOM_MEETING_SDK_SECRET
  );

  res.json({
    signature: signature,
  });
});

app.get("/getZak", async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.zoom.us/v2/users/me/token?type=zak`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    console.log(data)
    return res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error.message);
  }
});

app.post("/createMeeting", async (req, res) => {
  console.log("data");
  const options = {};
  try {
    const { data } = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: "test",
        type: 2,
        password: "123456",
        duration: 30,
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
        },
      },
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    console.log(data,"((((--------------data------------))))")

    return res.status(200).json({ data });
  } catch (error) {
    console.log(error, "\n-----------------------------------");
    // return res.status(500).json(error.message)
  }
});

app.get("/getMeeting/:id", async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://api.zoom.us/v2/meetings/${req.params.id}`,
      { headers: { Authorization: req.headers.authorization } }
    );
    console.log(data)
    return res.status(200).json({ data });
  } catch (error) {
    console.log(error,("-----error"));
    return res.status(500).json(error.message);
  }
});

app.post("/refresh_token", async (req, res) => {
  try {

    const base = ()=>{
      const buffer = Buffer.from(process.env.CLIENT_ID+':'+process.env.CLIENT_SECRET)
      return buffer.toString('base64')

    }
    const {data} = await axios.post("https://zoom.us/oauth/token",{
      grant_type: "refresh_token",
      refresh_token: req.body.refresh_token
    },{
      headers:{
        "Content-Type":"application/x-www-form-urlencoded",
        Authorization: `Basic ${base()}`
      }
    })

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

  } catch (error) {
    console.error(error,"(-----error------)")
  }
});


app.listen(port, () =>
  console.log(
    `Zoom Meeting SDK Auth Endpoint Sample Node.js listening on port ${port}!`
  )
);
