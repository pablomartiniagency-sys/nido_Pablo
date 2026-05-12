import type { Factura, Familia } from "@/types";

export function generarSEPA(
  facturas: Factura[],
  familias: Familia[],
  escuela: { nombre:string; nif:string; iban:string; bic:string; creditorId:string },
) {
  const adeudos = facturas.filter(f => f.estado !== "pagada" && f.estado !== "anulada");
  if (!adeudos.length) return { count:0, total:"0.00", fechaCobro:"", xml:"" };

  const total = adeudos.reduce((s,f)=>s+f.total, 0).toFixed(2);
  const msgId = `NIDO-${Date.now()}`;
  const fechaCobro = new Date(Date.now() + 14*24*3600*1000).toISOString().split("T")[0];
  const fechaCreacion = new Date().toISOString();

  const txs = adeudos.map((f, i) => {
    const fam = familias.find(x => x.id === f.familiaId);
    const iban = fam?.iban?.replace(/\s/g,"") ?? "";
    return `
    <DrctDbtTxInf>
      <PmtId><EndToEndId>${f.numero}</EndToEndId></PmtId>
      <InstdAmt Ccy="EUR">${f.total.toFixed(2)}</InstdAmt>
      <DrctDbtTx><MndtRltdInf><MndtId>MND-${f.familiaId}</MndtId><DtOfSgntr>2024-09-01</DtOfSgntr></MndtRltdInf></DrctDbtTx>
      <DbtrAgt><FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId></DbtrAgt>
      <Dbtr><Nm>${escapeXml(fam?.nombre ?? "")}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${iban}</IBAN></Id></DbtrAcct>
      <RmtInf><Ustrd>${f.periodo} - ${escapeXml(fam?.nombre ?? "")}</Ustrd></RmtInf>
    </DrctDbtTxInf>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${fechaCreacion}</CreDtTm>
      <NbOfTxs>${adeudos.length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <InitgPty><Nm>${escapeXml(escuela.nombre)}</Nm><Id><OrgId><Othr><Id>${escuela.creditorId}</Id></Othr></OrgId></Id></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${msgId}-PMT</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${adeudos.length}</NbOfTxs>
      <CtrlSum>${total}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>CORE</Cd></LclInstrm><SeqTp>RCUR</SeqTp></PmtTpInf>
      <ReqdColltnDt>${fechaCobro}</ReqdColltnDt>
      <Cdtr><Nm>${escapeXml(escuela.nombre)}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${escuela.iban}</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BIC>${escuela.bic}</BIC></FinInstnId></CdtrAgt>
      <CdtrSchmeId><Id><PrvtId><Othr><Id>${escuela.creditorId}</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId>
      ${txs}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;

  return { count: adeudos.length, total, fechaCobro, xml };
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" }[c]!));
}
