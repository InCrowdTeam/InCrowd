const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Operatore = require('../models/Operatore');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth - Endpoint per ID Token (esistente)
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'ID Token mancante' });
    }

    console.log('🔄 Google Auth - Verifica ID Token...');

    // Verifica il token con Google
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };

    console.log('✅ Google User verificato:', { email: googleUser.email, name: googleUser.name });

    // Cerca o crea l'utente nel database
    let user = await User.findOne({ email: googleUser.email });
    let userType = 'user';

    if (!user) {
      // Crea nuovo utente
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        isVerified: true
      });
      await user.save();
      console.log('✅ Nuovo utente creato:', user.email);
    } else {
      // Aggiorna dati esistenti
      user.googleId = googleUser.id;
      user.avatar = googleUser.picture;
      user.isVerified = true;
      await user.save();
      console.log('✅ Utente esistente aggiornato:', user.email);
    }

    // Controlla se è admin o operatore
    const admin = await Admin.findOne({ email: googleUser.email });
    const operatore = await Operatore.findOne({ email: googleUser.email });

    if (admin) {
      userType = 'admin';
      console.log('🔑 Login come admin:', admin.email);
    } else if (operatore) {
      userType = 'operatore';
      console.log('🔑 Login come operatore:', operatore.email);
    }

    // Genera JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        userType: userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Login Google completato con successo');

    res.json({
      message: 'Login Google riuscito',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      userType: userType
    });

  } catch (error) {
    console.error('💥 Errore Google Auth:', error);
    res.status(500).json({ 
      message: 'Errore interno del server durante Google Auth',
      error: error.message 
    });
  }
});

// Google OAuth - Nuovo endpoint per Authorization Code
router.post('/google-oauth', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code mancante' });
    }

    console.log('🔄 Google OAuth - Scambio code per token...');
    console.log('Code ricevuto:', code.substring(0, 20) + '...');
    console.log('Redirect URI:', redirectUri);

    // Scambia il code per un access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('❌ Errore scambio token:', tokenData);
      return res.status(400).json({ message: 'Errore scambio authorization code', details: tokenData });
    }

    console.log('✅ Token ricevuto da Google');

    // Usa l'access token per ottenere le info utente
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('❌ Errore recupero dati utente:', googleUser);
      return res.status(400).json({ message: 'Errore recupero dati utente Google' });
    }

    console.log('✅ Dati utente Google:', { email: googleUser.email, name: googleUser.name });

    // Cerca o crea l'utente nel database (stesso codice del Google ID Token)
    let user = await User.findOne({ email: googleUser.email });
    let userType = 'user';

    if (!user) {
      // Crea nuovo utente
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        isVerified: true
      });
      await user.save();
      console.log('✅ Nuovo utente creato:', user.email);
    } else {
      // Aggiorna dati esistenti
      user.googleId = googleUser.id;
      user.avatar = googleUser.picture;
      user.isVerified = true;
      await user.save();
      console.log('✅ Utente esistente aggiornato:', user.email);
    }

    // Controlla se è admin o operatore
    const admin = await Admin.findOne({ email: googleUser.email });
    const operatore = await Operatore.findOne({ email: googleUser.email });

    if (admin) {
      userType = 'admin';
      console.log('🔑 Login come admin:', admin.email);
    } else if (operatore) {
      userType = 'operatore';
      console.log('🔑 Login come operatore:', operatore.email);
    }

    // Genera JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        userType: userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Login Google OAuth completato con successo');

    res.json({
      message: 'Login Google OAuth riuscito',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      userType: userType
    });

  } catch (error) {
    console.error('💥 Errore Google OAuth:', error);
    res.status(500).json({ 
      message: 'Errore interno del server durante Google OAuth',
      error: error.message 
    });
  }
});

module.exports = router;