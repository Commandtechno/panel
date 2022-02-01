import pm2 from "pm2";

pm2.connect(err => {
  if (err) console.log(err);
  else console.log("Connected");
});

export default pm2;