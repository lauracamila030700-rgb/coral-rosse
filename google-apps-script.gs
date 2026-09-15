// =====================================================
// CORAL ROSSE CHOCOLATERIA - Google Apps Script
// =====================================================
// INSTRUCCIONES:
// 1. Abre tu hoja de calculo en Google Sheets
// 2. Ve a Extensiones > Apps Script
// 3. Borra todo el codigo que haya y pega ESTE archivo completo
// 4. Primero ejecuta la funcion "configurarHojas" (seleccionala arriba y dale play)
//    - Te pedira permisos, acepta todos
//    - Esto crea las columnas y formato en las hojas Pedidos y Gastos
// 5. Luego haz clic en "Implementar" > "Nueva implementacion"
//    - Tipo: Aplicacion web
//    - Ejecutar como: Yo
//    - Quien tiene acceso: Cualquier persona
//    - Haz clic en "Implementar"
// 6. Copia la URL que te da (se ve como https://script.google.com/macros/s/XXXXX/exec)
// 7. Pega esa URL en el archivo js/app.js de tu pagina web
//    donde dice: const GOOGLE_SHEETS_URL = '';
// =====================================================

// ===== CONFIGURAR HOJAS (ejecutar UNA sola vez) =====
function configurarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ---- HOJA: Pedidos ----
  let pedidos = ss.getSheetByName('Pedidos');
  if (!pedidos) {
    pedidos = ss.insertSheet('Pedidos');
  }

  const headersPedidos = [
    'Fecha Pedido',
    'Nombre Cliente',
    'Telefono',
    'Municipio',
    'Direccion',
    'Fecha Entrega',
    'Hora Entrega',
    'Detalle Pedido',
    'Cant. Cajas',
    'Total ($)',
    'Metodo de Pago',
    'Mensajes de las Cajas',
    'Notas del Cliente',
    'Estado'
  ];

  const rangePedidos = pedidos.getRange(1, 1, 1, headersPedidos.length);
  rangePedidos.setValues([headersPedidos]);
  rangePedidos.setFontWeight('bold');
  rangePedidos.setBackground('#8B1A2B');
  rangePedidos.setFontColor('#FFFFFF');
  rangePedidos.setHorizontalAlignment('center');
  pedidos.setFrozenRows(1);

  // Anchos de columna
  pedidos.setColumnWidth(1, 160);  // Fecha pedido
  pedidos.setColumnWidth(2, 180);  // Nombre
  pedidos.setColumnWidth(3, 130);  // Telefono
  pedidos.setColumnWidth(4, 150);  // Municipio
  pedidos.setColumnWidth(5, 200);  // Direccion
  pedidos.setColumnWidth(6, 140);  // Fecha entrega
  pedidos.setColumnWidth(7, 100);  // Hora entrega
  pedidos.setColumnWidth(8, 350);  // Detalle
  pedidos.setColumnWidth(9, 90);   // Cant cajas
  pedidos.setColumnWidth(10, 110); // Total
  pedidos.setColumnWidth(11, 130); // Metodo pago
  pedidos.setColumnWidth(12, 250); // Mensajes
  pedidos.setColumnWidth(13, 200); // Notas
  pedidos.setColumnWidth(14, 120); // Estado

  // Validacion de datos para Estado
  const estadoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pendiente', 'Confirmado', 'En preparacion', 'Enviado', 'Entregado', 'Cancelado'])
    .setAllowInvalid(false)
    .build();
  pedidos.getRange('N2:N1000').setDataValidation(estadoRule);

  // ---- HOJA: Gastos ----
  let gastos = ss.getSheetByName('Gastos');
  if (!gastos) {
    gastos = ss.insertSheet('Gastos');
  }

  const headersGastos = [
    'Fecha',
    'Chocolate Negro ($)',
    'Chocolate Blanco ($)',
    'Cajas ($)',
    'Arandanos ($)',
    'Frutos Secos ($)',
    'Arequipe ($)',
    'Nutella ($)',
    'Tarjetas de Mensaje ($)',
    'Decoracion Extra ($)',
    'Otros ($)',
    'Descripcion Otros',
    'Total Gasto ($)',
    'Notas'
  ];

  const rangeGastos = gastos.getRange(1, 1, 1, headersGastos.length);
  rangeGastos.setValues([headersGastos]);
  rangeGastos.setFontWeight('bold');
  rangeGastos.setBackground('#8B1A2B');
  rangeGastos.setFontColor('#FFFFFF');
  rangeGastos.setHorizontalAlignment('center');
  gastos.setFrozenRows(1);

  // Anchos de columna
  gastos.setColumnWidth(1, 130);   // Fecha
  gastos.setColumnWidth(2, 150);   // Choco negro
  gastos.setColumnWidth(3, 150);   // Choco blanco
  gastos.setColumnWidth(4, 110);   // Cajas
  gastos.setColumnWidth(5, 120);   // Arandanos
  gastos.setColumnWidth(6, 130);   // Frutos secos
  gastos.setColumnWidth(7, 120);   // Arequipe
  gastos.setColumnWidth(8, 120);   // Nutella
  gastos.setColumnWidth(9, 160);   // Tarjetas
  gastos.setColumnWidth(10, 150);  // Decoracion
  gastos.setColumnWidth(11, 120);  // Otros
  gastos.setColumnWidth(12, 200);  // Descripcion otros
  gastos.setColumnWidth(13, 140);  // Total
  gastos.setColumnWidth(14, 200);  // Notas

  // Formula automatica de total en gastos (columnas B a K = 2 a 11)
  // Se pone en la fila 2 como ejemplo y se puede copiar hacia abajo
  gastos.getRange('M2').setFormula('=SUM(B2:K2)');
  gastos.getRange('M2').setNote('Copia esta formula hacia abajo para cada fila nueva');

  // Formato de moneda para columnas de dinero en Gastos
  gastos.getRange('B2:K1000').setNumberFormat('#,##0');
  gastos.getRange('M2:M1000').setNumberFormat('#,##0');

  // Formato de moneda para Total en Pedidos
  pedidos.getRange('J2:J1000').setNumberFormat('#,##0');

  SpreadsheetApp.getUi().alert(
    'Hojas configuradas correctamente.\n\n' +
    '- Hoja "Pedidos": lista para recibir pedidos automaticamente\n' +
    '- Hoja "Gastos": lista para registrar tus gastos de materiales\n\n' +
    'Ahora implementa esta aplicacion como "Aplicacion web" para conectarla con tu pagina.'
  );
}

// ===== REGISTRAR PEDIDO (logica compartida) =====
function registrarPedido(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pedidos = ss.getSheetByName('Pedidos');

  if (!pedidos) {
    throw new Error('Hoja Pedidos no encontrada');
  }

  // Construir detalle legible
  var detalle = '';
  var mensajes = '';

  if (data.cajas && Array.isArray(data.cajas)) {
    data.cajas.forEach(function(caja, idx) {
      detalle += 'Caja ' + (idx + 1) + ' (x' + caja.size + '): ';
      if (caja.chocolates && Array.isArray(caja.chocolates)) {
        var chocos = caja.chocolates.map(function(c, i) {
          return (i + 1) + '.' + c.type + '/' + c.filling;
        });
        detalle += chocos.join(', ');
      }
      detalle += ' | ';

      if (caja.message) {
        mensajes += 'Caja ' + (idx + 1) + ': "' + caja.message + '" | ';
      }
    });
  }

  // Agregar fila
  pedidos.appendRow([
    new Date(),
    data.nombre || '',
    data.telefono || '',
    data.municipio || '',
    data.direccion || '',
    data.fechaEntrega || '',
    data.horaEntrega || '',
    detalle,
    data.cantidadCajas || 0,
    data.total || 0,
    data.metodoPago || '',
    mensajes,
    data.notas || '',
    'Pendiente'
  ]);
}

// ===== RECIBIR PEDIDOS VIA GET (imagen pixel - funciona en todos los navegadores) =====
function doGet(e) {
  try {
    if (e.parameter && e.parameter.data) {
      var data = JSON.parse(e.parameter.data);
      registrarPedido(data);
      // Devolver un pixel transparente 1x1
      return ContentService.createTextOutput('OK');
    }
    return ContentService.createTextOutput('Coral Rosse API activa');
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.toString());
  }
}

// ===== RECIBIR PEDIDOS VIA POST (respaldo) =====
function doPost(e) {
  try {
    var rawData;
    if (e.parameter && e.parameter.data) {
      rawData = e.parameter.data;
    } else if (e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    }

    var data = JSON.parse(rawData);
    registrarPedido(data);
    return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
