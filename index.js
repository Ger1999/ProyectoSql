const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const storage = multer.memoryStorage();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Sesiones
app.use(session({
  secret: 'clave-secreta-certus',
  resave: false,
  saveUninitialized: true
}));

// Conexión SQL
const config = {
  user: 'sa',
  password: 'sql',
  server: 'DESKTOP-IGQR2TO\\MSSQLS22',
  database: 'Bd_Proyec',
  options: {
    trustServerCertificate: true
  }
};

// Mostrar formulario de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Validar login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM cuenta WHERE nombre = ${username} AND contra = ${password}`;

    if (result.recordset.length > 0) {
      req.session.usuario = username;
      res.redirect('/bienvenido.html');
    } else {
      res.redirect('/?error=1');
    }
  } catch (err) {
    console.error('Error login:', err);
    res.redirect('/?error=2');
  }
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Enviar usuario actual
app.get('/usuario-logueado', (req, res) => {
  res.json({ usuario: req.session.usuario });
});

// Multer para subir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Subida de documentos
app.post('/subir-documentos', upload.fields([
  { name: 'dni' },
  { name: 'certificado' },
  { name: 'fotocarnet' }
]), async (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) return res.status(401).send('No autenticado');

  const dniFile = req.files['dni'][0];
  const certificadoFile = req.files['certificado'][0];
  const fotocarnetFile = req.files['fotocarnet'][0];

  try {
    await sql.connect(config);
    await sql.query`
      INSERT INTO DocumentosUsuario (
        usuario, dni, tipo_dni,
        certificado, tipo_certificado,
        fotocarnet, tipo_fotocarnet
      )
      VALUES (
        ${usuario}, ${dniFile.buffer}, ${dniFile.mimetype},
        ${certificadoFile.buffer}, ${certificadoFile.mimetype},
        ${fotocarnetFile.buffer}, ${fotocarnetFile.mimetype}
      )`;

    res.send('<h3 style="color:green;"> Documentos subidos correctamente.</h3>');
  } catch (err) {
    console.error('Error al subir:', err);
    res.send('<h3 style="color:red;"> Error al subir los documentos.</h3>');
  }
});

// Vista para Fernanda de todos los documentos
app.get('/ver-documentos', async (req, res) => {
  const usuario = req.session.usuario;

  //if (usuario !== 'Fernanda@certus.edu.pe') {
  //  return res.status(403).send(' No tienes permiso para ver documentos.');
  //}

  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM DocumentosUsuario`;
    const documentos = result.recordset;

    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Documentos Subidos</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <div class="container">
        <h2>Documentos Subidos por los Usuarios</h2>
        <a href="/logout"><button class="logout-btn"> Cerrar sesión</button></a>
    `;

    documentos.forEach(doc => {
      html += `
        <div class="doc-card">
          <strong> Usuario:</strong> ${doc.usuario}<br>

          <div class="doc-previews">
            <div>
              <p><strong>DNI:</strong></p>
              <iframe src="/ver-archivo/${doc.id}/dni" width="250" height="300"></iframe><br>
            </div>
            <div>
              <p><strong>Certificado:</strong></p>
              <iframe src="/ver-archivo/${doc.id}/certificado" width="250" height="300"></iframe><br>
            <div>
              <p><strong>Foto Carnet:</strong></p>
              <iframe src="/ver-archivo/${doc.id}/fotocarnet" width="250" height="300"></iframe><br>
            </div>
          </div>
        </div>
      <button onclick="history.back()">Regresar</button>`;
    });

    res.send(html);
  } catch (err) {
    console.error('Error al obtener documentos:', err);
    res.send('Error al obtener documentos');
  }
});

// Mostrar archivos (sin descargarlos)
app.get('/ver-archivo/:id/:campo', async (req, res) => {
  const { id, campo } = req.params;

  const campos = {
    dni: ['dni', 'tipo_dni'],
    certificado: ['certificado', 'tipo_certificado'],
    fotocarnet: ['fotocarnet', 'tipo_fotocarnet']
  };

  if (!campos[campo]) return res.status(400).send('Campo inválido');

  const [columna, tipoColumna] = campos[campo];

  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input('id', sql.Int, id);
    const result = await request.query(`
      SELECT ${columna}, ${tipoColumna}
      FROM DocumentosUsuario
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).send('Archivo no encontrado');
    }

    const archivo = result.recordset[0][columna];
    const tipoMime = result.recordset[0][tipoColumna] || 'application/octet-stream';

    res.setHeader('Content-Type', tipoMime);
    res.send(archivo); // Vista previa, sin descarga
  } catch (err) {
    console.error('Error al mostrar archivo:', err);
    res.status(500).send('Error al mostrar archivo');
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});


