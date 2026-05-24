import type { Familia, Factura, Gasto, Empleado, Nomina, SuministroFactura, MenuSemanal, Incidencia, CargoPendiente } from "@/types";

export const FAMILIAS: Familia[] = [
  { id:"fam-1", nombre:"Familia García López", email:"ana.garcia@email.com", telefono:"612345678", iban:"ES9121000418450200051332", alumnos:["Martina García (3a)", "Leo García (1a)"], servicios:[{ concepto:"Matrícula curso 25/26", importe:150 }, { concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }] },
  { id:"fam-2", nombre:"Familia Martínez Ruiz", email:"carlos.martinez@email.com", telefono:"623456789", iban:"ES6621000418401234567891", alumnos:["Sofía Martínez (2a)"], servicios:[{ concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }, { concepto:"Ampliación horaria", importe:50 }] },
  { id:"fam-3", nombre:"Familia Sánchez Torres", email:"laura.sanchez@email.com", telefono:"634567890", iban:"ES3010001234567890123456", alumnos:["Pablo Sánchez (3a)", "Carmen Sánchez (1a)", "Alma Sánchez (6m)"], servicios:[{ concepto:"Mensualidad completa 2h", importe:420 }, { concepto:"Mensualidad completa 1h", importe:420 }, { concepto:"Lactantes", importe:380 }, { concepto:"Comedor 3", importe:255 }] },
  { id:"fam-4", nombre:"Familia Díaz Fernández", email:"pedro.diaz@email.com", telefono:"645678901", iban:"ES7621000418450200051344", alumnos:["Hugo Díaz (2a)"], servicios:[{ concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }] },
  { id:"fam-5", nombre:"Familia López Moreno", email:"maria.lopez@email.com", telefono:"656789012", iban:"ES2621000418450200051355", alumnos:["Lucía López (3a)"], servicios:[{ concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }] },
  { id:"fam-6", nombre:"Familia González Ortiz", email:"jose.gonzalez@email.com", telefono:"667890123", iban:"ES1621000418450200051366", alumnos:["Daniel González (2a)", "Clara González (1a)"], servicios:[{ concepto:"Mensualidad completa 2h", importe:420 }, { concepto:"Lactantes", importe:380 }, { concepto:"Comedor 2", importe:170 }] },
  { id:"fam-7", nombre:"Familia Ramírez Molina", email:"ana.ramirez@email.com", telefono:"678901234", iban:"ES5621000418450200051377", alumnos:["Laura Ramírez (3a)"], servicios:[{ concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }] },
  { id:"fam-8", nombre:"Familia Torres Jiménez", email:"david.torres@email.com", telefono:"689012345", iban:"ES8621000418450200051388", alumnos:["Irene Torres (1a)", "Jorge Torres (3a)"], servicios:[{ concepto:"Mensualidad completa 1h", importe:420 }, { concepto:"Mensualidad completa 3h", importe:420 }, { concepto:"Comedor 2", importe:170 }] },
  { id:"fam-9", nombre:"Familia Navarro Castillo", email:"natalia.navarro@email.com", telefono:"690123456", iban:"ES4621000418450200051399", alumnos:["Sergio Navarro (2a)"], servicios:[{ concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }] },
  { id:"fam-10", nombre:"Familia Ortega Delgado", email:"miguel.ortega@email.com", telefono:"601234567", iban:"ES3621000418450200051400", alumnos:["Paula Ortega (3a)"], servicios:[{ concepto:"Mensualidad completa", importe:420 }, { concepto:"Comedor", importe:85 }] },
];

export const FACTURAS: Factura[] = [
  { id:"fac-1", numero:"F-2026-001", familiaId:"fam-1", familia:"Familia García López", periodo:"Junio 2026", items:[{ concepto:"Matrícula", importe:150 }, { concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:655, estado:"pagada", diasImpago:0 },
  { id:"fac-2", numero:"F-2026-002", familiaId:"fam-2", familia:"Familia Martínez Ruiz", periodo:"Junio 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }, { concepto:"Ampliación", importe:50 }], total:555, estado:"pagada", diasImpago:0 },
  { id:"fac-3", numero:"F-2026-003", familiaId:"fam-3", familia:"Familia Sánchez Torres", periodo:"Junio 2026", items:[{ concepto:"Mensualidad 2h", importe:420 }, { concepto:"Mensualidad 1h", importe:420 }, { concepto:"Lactantes", importe:380 }, { concepto:"Comedor 3", importe:255 }], total:1475, estado:"impago", diasImpago:15 },
  { id:"fac-4", numero:"F-2026-004", familiaId:"fam-4", familia:"Familia Díaz Fernández", periodo:"Junio 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"pagada", diasImpago:0 },
  { id:"fac-5", numero:"F-2026-005", familiaId:"fam-5", familia:"Familia López Moreno", periodo:"Junio 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"pagada", diasImpago:0 },
  { id:"fac-6", numero:"F-2026-006", familiaId:"fam-6", familia:"Familia González Ortiz", periodo:"Junio 2026", items:[{ concepto:"Mensualidad 2h", importe:420 }, { concepto:"Lactantes", importe:380 }, { concepto:"Comedor 2", importe:170 }], total:970, estado:"enviada", diasImpago:0 },
  { id:"fac-7", numero:"F-2026-007", familiaId:"fam-7", familia:"Familia Ramírez Molina", periodo:"Junio 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"pagada", diasImpago:0 },
  { id:"fac-8", numero:"F-2026-008", familiaId:"fam-8", familia:"Familia Torres Jiménez", periodo:"Junio 2026", items:[{ concepto:"Mensualidad 1h", importe:420 }, { concepto:"Mensualidad 3h", importe:420 }, { concepto:"Comedor 2", importe:170 }], total:1010, estado:"impago", diasImpago:32 },
  { id:"fac-9", numero:"F-2026-009", familiaId:"fam-9", familia:"Familia Navarro Castillo", periodo:"Junio 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"enviada", diasImpago:0 },
  { id:"fac-10", numero:"F-2026-010", familiaId:"fam-10", familia:"Familia Ortega Delgado", periodo:"Junio 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"pagada", diasImpago:0 },
  { id:"fac-11", numero:"F-2026-011", familiaId:"fam-1", familia:"Familia García López", periodo:"Mayo 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"pagada", diasImpago:0 },
  { id:"fac-12", numero:"F-2026-012", familiaId:"fam-2", familia:"Familia Martínez Ruiz", periodo:"Mayo 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }, { concepto:"Ampliación", importe:50 }], total:555, estado:"pagada", diasImpago:0 },
  { id:"fac-13", numero:"F-2026-013", familiaId:"fam-3", familia:"Familia Sánchez Torres", periodo:"Mayo 2026", items:[{ concepto:"Mensualidad 2h", importe:420 }, { concepto:"Mensualidad 1h", importe:420 }, { concepto:"Lactantes", importe:380 }, { concepto:"Comedor 3", importe:255 }], total:1475, estado:"impago", diasImpago:46 },
  { id:"fac-14", numero:"F-2026-014", familiaId:"fam-4", familia:"Familia Díaz Fernández", periodo:"Mayo 2026", items:[{ concepto:"Mensualidad", importe:420 }, { concepto:"Comedor", importe:85 }], total:505, estado:"pagada", diasImpago:0 },
  { id:"fac-15", numero:"F-2026-015", familiaId:"fam-8", familia:"Familia Torres Jiménez", periodo:"Mayo 2026", items:[{ concepto:"Mensualidad 1h", importe:420 }, { concepto:"Mensualidad 3h", importe:420 }, { concepto:"Comedor 2", importe:170 }], total:1010, estado:"impago", diasImpago:63 },
];

export const GASTOS: Gasto[] = [
  { id:"gas-1", fecha:"2026-06-03", proveedor:"Makro", concepto:"Pedido semanal comedor", importe:342.80, iva:21, categoria:"alimentacion", recurrencia:"mensual", notas:"Frutas, verduras, carne, pescado, lácteos" },
  { id:"gas-2", fecha:"2026-06-05", proveedor:"Endesa", concepto:"Electricidad mayo", importe:218.00, iva:21, categoria:"suministros", recurrencia:"mensual", notas:"Tarifa 2.0TD - 890 kWh" },
  { id:"gas-3", fecha:"2026-06-07", proveedor:"Dideco", concepto:"Material didáctico primavera", importe:189.50, iva:21, categoria:"material", recurrencia:"puntual", notas:"Témperas, cartulinas, plastilina, pinceles" },
  { id:"gas-4", fecha:"2026-06-10", proveedor:"SegurCaixa", concepto:"Seguro RC y accidentes", importe:145.00, iva:0, categoria:"seguros", recurrencia:"anual", notas:"Póliza RC escolar 25/26" },
  { id:"gas-5", fecha:"2026-06-12", proveedor:"Aigües de Barcelona", concepto:"Agua mayo", importe:87.30, iva:10, categoria:"suministros", recurrencia:"mensual", notas:"Consumo 45 m³" },
  { id:"gas-6", fecha:"2026-06-15", proveedor:"Mercadona", concepto:"Limpieza e higiene", importe:124.90, iva:21, categoria:"limpieza", recurrencia:"mensual", notas:"Lejía, desinfectante, guantes, papel" },
  { id:"gas-7", fecha:"2026-06-18", proveedor:"Orange", concepto:"Internet + móvil", importe:58.90, iva:21, categoria:"suministros", recurrencia:"mensual", notas:"Fibra 600Mb + 3 líneas" },
  { id:"gas-8", fecha:"2026-06-01", proveedor:"Inmobiliaria Centro", concepto:"Alquiler local", importe:1200.00, iva:21, categoria:"alquiler", recurrencia:"mensual", notas:"Local 180m² en Av. Constitución" },
  { id:"gas-9", fecha:"2026-06-20", proveedor:"Gestoría ASES", concepto:"Asesoría fiscal-laboral", importe:250.00, iva:21, categoria:"gestoria", recurrencia:"mensual", notas:"Liquidación trimestral + nóminas" },
  { id:"gas-10", fecha:"2026-06-25", proveedor:"Ferretería La Llave", concepto:"Reparación grifo cocina", importe:95.00, iva:21, categoria:"mantenimiento", recurrencia:"puntual", notas:"Fontanería aula lactantes" },
  { id:"gas-11", fecha:"2026-05-03", proveedor:"Makro", concepto:"Pedido semanal comedor", importe:328.50, iva:21, categoria:"alimentacion", recurrencia:"mensual", notas:"" },
  { id:"gas-12", fecha:"2026-05-05", proveedor:"Endesa", concepto:"Electricidad abril", importe:236.00, iva:21, categoria:"suministros", recurrencia:"mensual", notas:"Tarifa 2.0TD - 940 kWh" },
  { id:"gas-13", fecha:"2026-04-03", proveedor:"Makro", concepto:"Pedido semanal comedor", importe:355.20, iva:21, categoria:"alimentacion", recurrencia:"mensual", notas:"" },
  { id:"gas-14", fecha:"2026-04-05", proveedor:"Endesa", concepto:"Electricidad marzo", importe:251.00, iva:21, categoria:"suministros", recurrencia:"mensual", notas:"Tarifa 2.0TD - 970 kWh" },
  { id:"gas-15", fecha:"2026-04-10", proveedor:"Google", concepto:"Google Ads campaña primavera", importe:150.00, iva:21, categoria:"marketing", recurrencia:"puntual", notas:"" },
];

export const EMPLEADOS: Empleado[] = [
  { id:"emp-1", nombre:"María José Fernández", dni:"12345678A", puesto:"Directora", tipoContrato:"indefinido", horasSemanales:40, salarioBrutoMensual:2400, fechaAlta:"2021-09-01", iban:"ES6621000418401234567891", activo:true },
  { id:"emp-2", nombre:"Laura García López", dni:"23456789B", puesto:"Educadora (3 años)", tipoContrato:"indefinido", horasSemanales:37.5, salarioBrutoMensual:1850, fechaAlta:"2022-01-15", iban:"ES3010001234567890123456", activo:true },
  { id:"emp-3", nombre:"Carmen Ruiz Torres", dni:"34567890C", puesto:"Educadora (2 años)", tipoContrato:"indefinido", horasSemanales:37.5, salarioBrutoMensual:1850, fechaAlta:"2022-09-01", iban:"ES7621000418450200051344", activo:true },
  { id:"emp-4", nombre:"Patricia Molina Sánchez", dni:"45678901D", puesto:"Educadora (1 año)", tipoContrato:"indefinido", horasSemanales:37.5, salarioBrutoMensual:1850, fechaAlta:"2023-04-01", iban:"ES2621000418450200051355", activo:true },
  { id:"emp-5", nombre:"Raquel Navarro Díaz", dni:"56789012E", puesto:"Educadora (lactantes)", tipoContrato:"temporal", horasSemanales:37.5, salarioBrutoMensual:1950, fechaAlta:"2024-10-01", iban:"ES1621000418450200051366", activo:true },
  { id:"emp-6", nombre:"Sonia Ortiz Martín", dni:"67890123F", puesto:"Cocinera", tipoContrato:"indefinido", horasSemanales:35, salarioBrutoMensual:1600, fechaAlta:"2022-03-15", iban:"ES5621000418450200051377", activo:true },
  { id:"emp-7", nombre:"David Serrano López", dni:"78901234G", puesto:"Ayudante de cocina", tipoContrato:"temporal", horasSemanales:25, salarioBrutoMensual:1050, fechaAlta:"2025-01-10", iban:"ES8621000418450200051388", activo:true },
  { id:"emp-8", nombre:"Ana Belén Pérez", dni:"89012345H", puesto:"Personal limpieza", tipoContrato:"indefinido", horasSemanales:20, salarioBrutoMensual:850, fechaAlta:"2022-06-01", iban:"ES4621000418450200051399", activo:true },
  { id:"emp-9", nombre:"Elena García Castillo", dni:"90123456I", puesto:"Educadora (apoyo)", tipoContrato:"practicas", horasSemanales:30, salarioBrutoMensual:1200, fechaAlta:"2025-09-01", iban:"ES3621000418450200051400", activo:true },
];

export const NOMINAS: Nomina[] = [
  { id:"nom-1", empleadoId:"emp-1", periodo:"Mayo 2026", bruto:2400, irpf:432, ssEmpleado:180, ssEmpresa:780, neto:1788, pagada:true },
  { id:"nom-2", empleadoId:"emp-2", periodo:"Mayo 2026", bruto:1850, irpf:277.50, ssEmpleado:138.75, ssEmpresa:601.25, neto:1433.75, pagada:true },
  { id:"nom-3", empleadoId:"emp-3", periodo:"Mayo 2026", bruto:1850, irpf:240.50, ssEmpleado:138.75, ssEmpresa:601.25, neto:1470.75, pagada:true },
  { id:"nom-4", empleadoId:"emp-4", periodo:"Mayo 2026", bruto:1850, irpf:240.50, ssEmpleado:138.75, ssEmpresa:601.25, neto:1470.75, pagada:true },
  { id:"nom-5", empleadoId:"emp-5", periodo:"Mayo 2026", bruto:1950, irpf:253.50, ssEmpleado:146.25, ssEmpresa:633.75, neto:1550.25, pagada:true },
  { id:"nom-6", empleadoId:"emp-6", periodo:"Mayo 2026", bruto:1600, irpf:192, ssEmpleado:120, ssEmpresa:520, neto:1288, pagada:true },
  { id:"nom-7", empleadoId:"emp-7", periodo:"Mayo 2026", bruto:1050, irpf:105, ssEmpleado:78.75, ssEmpresa:341.25, neto:866.25, pagada:true },
  { id:"nom-8", empleadoId:"emp-8", periodo:"Mayo 2026", bruto:850, irpf:68, ssEmpleado:63.75, ssEmpresa:276.25, neto:718.25, pagada:true },
  { id:"nom-9", empleadoId:"emp-9", periodo:"Mayo 2026", bruto:1200, irpf:60, ssEmpleado:90, ssEmpresa:390, neto:1050, pagada:true },
  { id:"nom-10", empleadoId:"emp-1", periodo:"Abril 2026", bruto:2400, irpf:432, ssEmpleado:180, ssEmpresa:780, neto:1788, pagada:true },
  { id:"nom-11", empleadoId:"emp-2", periodo:"Abril 2026", bruto:1850, irpf:277.50, ssEmpleado:138.75, ssEmpresa:601.25, neto:1433.75, pagada:true },
  { id:"nom-12", empleadoId:"emp-3", periodo:"Abril 2026", bruto:1850, irpf:240.50, ssEmpleado:138.75, ssEmpresa:601.25, neto:1470.75, pagada:true },
];

export const SUMINISTROS: SuministroFactura[] = [
  { id:"sum-1", tipo:"electricidad", proveedor:"Endesa", periodo:"Mar 2026", consumo:970, unidad:"kWh", importe:261.00, fecha:"2026-03-05" },
  { id:"sum-2", tipo:"electricidad", proveedor:"Endesa", periodo:"Abr 2026", consumo:940, unidad:"kWh", importe:236.00, fecha:"2026-04-05" },
  { id:"sum-3", tipo:"electricidad", proveedor:"Endesa", periodo:"May 2026", consumo:890, unidad:"kWh", importe:218.00, fecha:"2026-05-05" },
  { id:"sum-4", tipo:"agua", proveedor:"Aigües Barcelona", periodo:"Mar 2026", consumo:48, unidad:"m³", importe:92.10, fecha:"2026-03-12" },
  { id:"sum-5", tipo:"agua", proveedor:"Aigües Barcelona", periodo:"Abr 2026", consumo:46, unidad:"m³", importe:89.50, fecha:"2026-04-12" },
  { id:"sum-6", tipo:"agua", proveedor:"Aigües Barcelona", periodo:"May 2026", consumo:45, unidad:"m³", importe:87.30, fecha:"2026-05-12" },
  { id:"sum-7", tipo:"internet", proveedor:"Orange", periodo:"Mar 2026", consumo:0, unidad:"---", importe:58.90, fecha:"2026-03-18" },
  { id:"sum-8", tipo:"internet", proveedor:"Orange", periodo:"Abr 2026", consumo:0, unidad:"---", importe:58.90, fecha:"2026-04-18" },
  { id:"sum-9", tipo:"internet", proveedor:"Orange", periodo:"May 2026", consumo:0, unidad:"---", importe:58.90, fecha:"2026-05-18" },
  { id:"sum-10", tipo:"electricidad", proveedor:"Endesa", periodo:"Feb 2026", consumo:1010, unidad:"kWh", importe:275.00, fecha:"2026-02-05" },
  { id:"sum-11", tipo:"electricidad", proveedor:"Endesa", periodo:"Ene 2026", consumo:1050, unidad:"kWh", importe:289.00, fecha:"2026-01-05" },
  { id:"sum-12", tipo:"electricidad", proveedor:"Endesa", periodo:"Dic 2025", consumo:980, unidad:"kWh", importe:254.00, fecha:"2025-12-05" },
];

export const MENU: MenuSemanal = {
  lunes: { primero:"Puré de calabacín y patata", segundo:"Pollo al horno con arroz", postre:"Manzana asada" },
  martes: { primero:"Crema de zanahoria y puerro", segundo:"Merluza rebozada con puré", postre:"Yogur natural" },
  miercoles: { primero:"Sopa de letras con verduras", segundo:"Lentejas con arroz", postre:"Plátano" },
  jueves: { primero:"Puré de verduras mixtas", segundo:"Tortilla francesa con judías verdes", postre:"Compota de pera" },
  viernes: { primero:"Crema de calabaza y naranja", segundo:"Albóndigas de ternera con patatas", postre:"Fruta del día" },
};

export const INCIDENCIAS: Incidencia[] = [
  { id:"inc-1", alumno:"Martina García", tipo:"caida", descripcion:"Pequeña caída en el patio, rozadura en rodilla", gravedad:"leve", notificada:true, resuelta:true, fecha:"2026-06-03" },
  { id:"inc-2", alumno:"Sofía Martínez", tipo:"alergia", descripcion:"Leve reacción alérgica tras desayuno (revisar alimentos)", gravedad:"moderada", notificada:true, resuelta:true, fecha:"2026-06-07" },
  { id:"inc-3", alumno:"Pablo Sánchez", tipo:"fiebre", descripcion:"38.5°C a media mañana, recogido por familia", gravedad:"moderada", notificada:true, resuelta:true, fecha:"2026-06-10" },
  { id:"inc-4", alumno:"Hugo Díaz", tipo:"conflicto", descripcion:"Disputa por juguete con compañero, mordisco en brazo", gravedad:"leve", notificada:true, resuelta:true, fecha:"2026-06-12" },
  { id:"inc-5", alumno:"Daniel González", tipo:"caida", descripcion:"Tropiezo en escalón, pequeña contusión frente", gravedad:"moderada", notificada:true, resuelta:false, fecha:"2026-06-15" },
  { id:"inc-6", alumno:"Irene Torres", tipo:"otro", descripcion:"Dolor de tripa sin fiebre, vigilancia en aula", gravedad:"leve", notificada:true, resuelta:true, fecha:"2026-06-16" },
  { id:"inc-7", alumno:"Sergio Navarro", tipo:"alergia", descripcion:"Sospecha alergia al kiwi (ofrecido en merienda)", gravedad:"leve", notificada:false, resuelta:false, fecha:"2026-06-18" },
];

export const CARGOS_PENDIENTES: CargoPendiente[] = [
  { id:"cargo-1", familiaId:"fam-3", alumnoId:"alu-3", alumnoNombre:"Pablo Sánchez", concepto:"Pañales e higiene Junio", importe:25, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"material" },
  { id:"cargo-2", familiaId:"fam-3", alumnoId:"alu-4", alumnoNombre:"Carmen Sánchez", concepto:"Pañales e higiene Junio", importe:25, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"material" },
  { id:"cargo-3", familiaId:"fam-3", alumnoId:"alu-5", alumnoNombre:"Alma Sánchez", concepto:"Pañales e higiene Junio", importe:25, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"material" },
  { id:"cargo-4", familiaId:"fam-1", alumnoId:"alu-1", alumnoNombre:"Martina García", concepto:"Extraescolar inglés Junio", importe:35, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"extraescolar" },
  { id:"cargo-5", familiaId:"fam-1", alumnoId:"alu-2", alumnoNombre:"Leo García", concepto:"Extraescolar psicomotricidad Junio", importe:30, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"extraescolar" },
  { id:"cargo-6", familiaId:"fam-6", alumnoId:"alu-7", alumnoNombre:"Daniel González", concepto:"Material didáctico Junio", importe:20, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"material" },
  { id:"cargo-7", familiaId:"fam-6", alumnoId:"alu-8", alumnoNombre:"Clara González", concepto:"Material didáctico Junio", importe:20, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pendiente", tipo:"material" },
  { id:"cargo-8", familiaId:"fam-2", alumnoId:"alu-2", alumnoNombre:"Sofía Martínez", concepto:"Ampliación horaria tarde Junio", importe:40, fechaEmision:"2026-06-01", fechaVencimiento:"2026-07-05", estado:"pendiente", tipo:"cuota" },
  { id:"cargo-9", familiaId:"fam-4", alumnoId:"alu-6", alumnoNombre:"Hugo Díaz", concepto:"Material didáctico Junio", importe:20, fechaEmision:"2026-06-01", fechaVencimiento:"2026-06-30", estado:"pagado", tipo:"material", notas:"Pagado en efectivo 15/06" },
];
