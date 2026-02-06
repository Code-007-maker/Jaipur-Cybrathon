require('dotenv').config();
console.log("Raw Key Length:", process.env.GOOGLE_PRIVATE_KEY?.length);
console.log("Raw Key Start:", process.env.GOOGLE_PRIVATE_KEY?.substring(0, 50));
console.log("Raw Key End:", process.env.GOOGLE_PRIVATE_KEY?.substring(process.env.GOOGLE_PRIVATE_KEY.length - 50));
