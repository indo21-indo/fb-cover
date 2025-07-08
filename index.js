const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jimp = require('jimp');
const { loadImage, createCanvas, registerFont } = require('canvas');

const app = express();
const PORT = process.env.PORT || 5000;



async function circle(imagePath) {
  const image = await jimp.read(imagePath);
  image.circle();
  return await image.getBufferAsync('image/png');
}

app.get('/fbcover/v1', async (req, res) => {
  try {
    const tenchinh = req.query.name;
    let color = req.query.color || '#ffffff';
    const address = req.query.address;
    const name = tenchinh ? tenchinh.toUpperCase() : null;
    const email = req.query.email;
    const subname = req.query.subname;
    const phoneNumber = req.query.sdt;
    const uid = req.query.uid;

    if (!address || !name || !email || !subname || !phoneNumber || !uid) {
      return res.status(400).json({ error: 'ডাটা সম্পূর্ণ নয়, অনুগ্রহ করে সব ফিল্ড পূরণ করুন।' });
    }

    // Cache ফোল্ডার তৈরি
    const cacheDir = path.resolve(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const pathImg = path.join(cacheDir, 'fbcover1.png');
    const pathAva = path.join(cacheDir, 'fbcover2.png');
    const pathLine = path.join(cacheDir, 'fbcover3.png');
    const fontPath = path.join(cacheDir, 'UTMAvoBold.ttf');

    // Facebook avatar ডাউনলোড
    const avtAnime = (await axios.get(
      encodeURI(`https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`),
      { responseType: 'arraybuffer' }
    )).data;

    // Background image ডাউনলোড
    const background = (await axios.get(
      'https://i.ibb.co/ZS9smfM/Coverfastpake-tanvir-6x.jpg',
      { responseType: 'arraybuffer' }
    )).data;

    // Mask image ডাউনলোড
    const hieuung = (await axios.get(
      'https://1.bp.blogspot.com/-zl3qntcfDhY/YSdEQNehJJI/AAAAAAAAwtY/C17yMRMBjGstL_Cq6STfSYyBy-mwjkdQwCNcBGAsYHQ/s0/mask.png',
      { responseType: 'arraybuffer' }
    )).data;

    // ফাইলগুলো সেভ করো
    fs.writeFileSync(pathAva, Buffer.from(avtAnime));
    fs.writeFileSync(pathImg, Buffer.from(background));
    fs.writeFileSync(pathLine, Buffer.from(hieuung));

    // গোলাকৃতি অবতার তৈরি
    const avatarBuffer = await circle(pathAva);

    // ফন্ট ডাউনলোড করো যদি না থাকে
    if (!fs.existsSync(fontPath)) {
      const getfont2 = (await axios.get(
        'https://drive.google.com/u/0/uc?id=1DuI-ou9OGEkII7n8odx-A7NIcYz0Xk9o&export=download',
        { responseType: 'arraybuffer' }
      )).data;
      fs.writeFileSync(fontPath, Buffer.from(getfont2));
    }

    // ইমেজ লোড
    const baseImage = await loadImage(pathImg);
    const baseAva = await loadImage(avatarBuffer);
    const baseLine = await loadImage(pathLine);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    registerFont(fontPath, { family: 'UTMAvoBold' });

    ctx.strokeStyle = 'rgba(255,255,255, 0.2)';
    ctx.lineWidth = 3;
    ctx.font = '100px UTMAvoBold';
    ctx.strokeText(name, 30, 100);
    ctx.strokeText(name, 130, 200);
    ctx.textAlign = 'right';
    ctx.strokeText(name, canvas.width - 30, canvas.height - 30);
    ctx.strokeText(name, canvas.width - 130, canvas.height - 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = '55px UTMAvoBold';
    ctx.fillText(name, 680, 270);

    ctx.font = '40px UTMAvoBold';
    ctx.textAlign = 'right';
    ctx.fillText(subname.toUpperCase(), 680, 320);

    ctx.font = '23px UTMAvoBold';
    ctx.textAlign = 'start';
    ctx.fillText(phoneNumber.toUpperCase(), 1350, 252);
    ctx.fillText(email.toUpperCase(), 1350, 332);
    ctx.fillText(address.toUpperCase(), 1350, 410);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(baseLine, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.drawImage(baseAva, 824, 180, 285, 285);

    const finalBuffer = canvas.toBuffer();

    res.type('png').send(finalBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'সার্ভারে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।' });
  }
});

// Static ফাইল serve করার জন্য public ফোল্ডার
app.use(express.static(path.join(__dirname, 'public')));

// যদি ইউজার '/' (root) এ যাক, তাহলে index.html পাঠাবে
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
