'use client';

import React from 'react';
import { SaleRecord } from '@/lib/store';

interface ThermalTicketProps {
  ticket: SaleRecord;
}

export default function ThermalTicket({ ticket }: ThermalTicketProps) {
  const currentTicket = ticket;
  if (!currentTicket) return null;

        const ticketDate = currentTicket.createdAt ? new Date(currentTicket.createdAt) : new Date();
        const formattedDate = ticketDate.toLocaleDateString('es-SV', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
        const formattedTime = ticketDate.toLocaleTimeString('es-SV', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).toLowerCase();

        const totalItemsCount = (currentTicket.items || []).reduce(
          (acc: number, item: any) => acc + (Number(item.quantity) || 1),
          0
        );

        const subtotal = Number(currentTicket.subtotal || 0).toFixed(2);
        const total = Number(currentTicket.total || 0).toFixed(2);
        const cashRec = currentTicket.cashReceived != null ? Number(currentTicket.cashReceived).toFixed(2) : null;
        const cashChg = currentTicket.cashChange != null ? Number(currentTicket.cashChange).toFixed(2) : null;

        const isDte = Boolean(currentTicket.dteInfo && currentTicket.dteInfo.codigoGeneracion);
        const docTipoLabel = currentTicket.tipoComprobante === '03'
          ? 'COMPROBANTE DE CRÉDITO FISCAL'
          : 'FACTURA CONSUMIDOR FINAL';

        return (
          <div id="printable-thermal-ticket" aria-hidden="true" style={{ width: '70mm', margin: '0 auto', fontFamily: '"Courier New", Courier, monospace', fontSize: '10px', color: '#000', lineHeight: 1.25 }}>
            {/* 1. ENCABEZADO DEL EMISOR */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.5px' }}>AROMANIAK SV</div>
              <div style={{ fontSize: '9px', marginTop: '2px' }}>VENTA DE PERFUMERÍA Y FRAGANCIAS</div>
              <div style={{ fontSize: '9px' }}>COLONIA ESCALÓN, CALLE PRINCIPAL #123</div>
              <div style={{ fontSize: '9px' }}>MUNICIPIO Y DEPARTAMENTO DE</div>
              <div style={{ fontSize: '9px' }}>SAN SALVADOR, EL SALVADOR</div>
              <div style={{ fontSize: '9px', marginTop: '1px' }}>Iva DL 245678-9 Nit: 0614-120590-101-2</div>
              <div style={{ fontSize: '9px', fontWeight: 'bold' }}>AROMANIAK S.A. DE C.V.</div>
              <div style={{ fontSize: '8.5px', marginTop: '1px' }}>GIRO: VENTA AL POR MENOR DE PERFUMERÍA Y COSMÉTICOS</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

            {/* 2. METADATOS DE VENTA Y CAJA */}
            <div style={{ fontSize: '9.5px', lineHeight: 1.3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Rec.: {currentTicket.saleNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cajero: {currentTicket.cajero || 'Caja 1'}</span>
                <span>Trans.: {currentTicket.id ? currentTicket.id.slice(-6).toUpperCase() : '1001'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Suc.: S001</span>
                <span>Caja: {currentTicket.cajero?.includes('2') ? '2' : '1'}</span>
              </div>
              <div>Fecha: {formattedDate} {formattedTime}</div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

            {/* 3. BLOQUE FISCAL DTE / HACIENDA */}
            <div style={{ fontSize: '9px', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
                {isDte ? 'NO ES UN DOCUMENTO FISCAL' : 'COMPROBANTE INTERNO DE PAGO'}
              </div>
              <div style={{ fontWeight: 'bold' }}>
                TIPO DOC: {docTipoLabel}
              </div>
              {isDte && currentTicket.dteInfo && (() => {
                const dte = currentTicket.dteInfo as any;
                return (
                  <>
                    <div>Fecha y hora de generacion:</div>
                    <div style={{ paddingLeft: '4px' }}>
                      {dte.fhProcesamiento
                        ? new Date(dte.fhProcesamiento).toLocaleString('es-SV')
                        : `${formattedDate} ${formattedTime}`}
                    </div>
                    <div>Codigo de generacion:</div>
                    <div style={{ fontWeight: 'bold', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {dte.codigoGeneracion}
                    </div>
                    {dte.numeroControl && (
                      <>
                        <div>Numero de control:</div>
                        <div style={{ fontWeight: 'bold', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {dte.numeroControl}
                        </div>
                      </>
                    )}
                    {dte.selloRecepcion && (
                      <>
                        <div>Sello de autorizacion:</div>
                        <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '8.5px' }}>
                          {dte.selloRecepcion}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Si es Crédito Fiscal, mostrar datos del cliente */}
              {currentTicket.cliente?.nombre && (
                <div style={{ marginTop: '3px', paddingTop: '2px', borderTop: '1px dotted #666' }}>
                  <div>CLIENTE: {currentTicket.cliente.nombre}</div>
                  {currentTicket.cliente.numDocumento && <div>DOC/NIT: {currentTicket.cliente.numDocumento}</div>}
                  {currentTicket.cliente.nrc && <div>NRC: {currentTicket.cliente.nrc}</div>}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

            {/* 4. TABLA DE ÍTEMS / PRODUCTOS */}
            <div style={{ fontSize: '9.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '3px' }}>
                <span style={{ width: '38px' }}>Cantid</span>
                <span style={{ flex: 1, textAlign: 'left', paddingLeft: '4px' }}>Descripción</span>
                <span style={{ width: '42px', textAlign: 'right' }}>Precio</span>
                <span style={{ width: '48px', textAlign: 'right' }}>Total $:</span>
              </div>

              {(currentTicket.items || []).map((it: any, idx: number) => {
                const qty = it.quantity || 1;
                const price = Number(it.price || 0).toFixed(2);
                const itemTotal = Number(it.total || 0).toFixed(2);
                const name = (it.name || 'PRODUCTO').toUpperCase();

                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px', lineHeight: 1.25 }}>
                    <span style={{ width: '38px', fontFamily: 'monospace' }}>{qty}</span>
                    <span style={{ flex: 1, textAlign: 'left', paddingLeft: '4px', paddingRight: '4px', wordBreak: 'break-word' }}>
                      {name} {it.unit ? `(${it.unit})` : ''}
                    </span>
                    <span style={{ width: '42px', textAlign: 'right', fontFamily: 'monospace' }}>{price}</span>
                    <span style={{ width: '48px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{itemTotal}G</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0 2px 0' }} />

            {/* 5. RESUMEN DE IMPUESTOS Y TOTALES */}
            <div style={{ fontSize: '9.5px', lineHeight: 1.3 }}>
              <div style={{ fontSize: '8.5px', fontWeight: 'bold', marginBottom: '2px' }}>G=GRAVADO   E=EXENTO</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SUB TOTAL $:</span>
                <span style={{ fontFamily: 'monospace' }}>{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>EXENTO $:</span>
                <span style={{ fontFamily: 'monospace' }}>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GRAVADO $:</span>
                <span style={{ fontFamily: 'monospace' }}>{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>VENTAS NO SUJETAS $:</span>
                <span style={{ fontFamily: 'monospace' }}>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CESC $:</span>
                <span style={{ fontFamily: 'monospace' }}>0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', borderTop: '1px solid #000', paddingTop: '2px', marginTop: '2px' }}>
                <span>TOTAL A PAGAR $:</span>
                <span style={{ fontFamily: 'monospace' }}>{total}</span>
              </div>

              {/* FORMA DE PAGO */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                <span>{currentTicket.paymentMethod === 'CARD' ? 'TARJETA (WOMPI)' : currentTicket.paymentMethod === 'TRANSFER' ? 'TRANSFERENCIA' : 'EFECTIVO'}:</span>
                <span style={{ fontFamily: 'monospace' }}>{total}</span>
              </div>

              {currentTicket.paymentMethod === 'CASH' && cashRec && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>RECIBIDO $:</span>
                    <span style={{ fontFamily: 'monospace' }}>{cashRec}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CAMBIO $:</span>
                    <span style={{ fontFamily: 'monospace' }}>{cashChg || '0.00'}</span>
                  </div>
                </>
              )}

              {currentTicket.paymentMethod === 'CARD' && (
                <div style={{ fontSize: '8.5px', marginTop: '2px', color: '#333' }}>
                  <div>Terminal ID: 00284383</div>
                  <div>Transacción Aprobada Wompi</div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0 2px 0' }} />

            {/* 6. CONTEO DE PRODUCTOS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontWeight: 'bold', margin: '2px 0 4px 0' }}>
              <span>Numero de productos:</span>
              <span style={{ fontFamily: 'monospace' }}>{totalItemsCount}</span>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

            {/* 7. PIE DE PÁGINA Y LEYENDA */}
            <div style={{ textAlign: 'center', fontSize: '9px', lineHeight: 1.3, marginTop: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px' }}>GRACIAS POR TU COMPRA</div>
              <div style={{ fontWeight: 'bold' }}>AROMANIAK SV</div>
              <div>www.aromaniaksv.com</div>
              <div style={{ marginTop: '2px' }}>SERVICIO AL CLIENTE TEL. +503 2245-8800</div>
              <div style={{ fontSize: '8.5px', marginTop: '2px' }}>Para reclamos presentar este Ticket</div>
              <div style={{ fontSize: '8.5px' }}>y tu Documento de Identidad Personal</div>

              {isDte && (
                <div style={{ marginTop: '5px', paddingTop: '4px', borderTop: '1px dotted #000', fontSize: '8.5px', wordBreak: 'break-all' }}>
                  Consulta tu factura electrónica en:<br/>
                  <strong>https://admin.factura.gob.sv/consultaPublica</strong>
                </div>
              )}

              {/* 8. REPRESENTACIÓN DE CÓDIGO DE BARRAS */}
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <svg viewBox="0 0 200 35" style={{ width: '150px', height: '28px', margin: '0 auto', display: 'block' }}>
                  <rect x="5" y="0" width="2" height="35" fill="#000" />
                  <rect x="9" y="0" width="4" height="35" fill="#000" />
                  <rect x="16" y="0" width="1" height="35" fill="#000" />
                  <rect x="20" y="0" width="3" height="35" fill="#000" />
                  <rect x="26" y="0" width="2" height="35" fill="#000" />
                  <rect x="31" y="0" width="5" height="35" fill="#000" />
                  <rect x="39" y="0" width="1" height="35" fill="#000" />
                  <rect x="43" y="0" width="3" height="35" fill="#000" />
                  <rect x="49" y="0" width="2" height="35" fill="#000" />
                  <rect x="54" y="0" width="4" height="35" fill="#000" />
                  <rect x="61" y="0" width="2" height="35" fill="#000" />
                  <rect x="66" y="0" width="3" height="35" fill="#000" />
                  <rect x="72" y="0" width="1" height="35" fill="#000" />
                  <rect x="76" y="0" width="5" height="35" fill="#000" />
                  <rect x="84" y="0" width="2" height="35" fill="#000" />
                  <rect x="89" y="0" width="3" height="35" fill="#000" />
                  <rect x="95" y="0" width="1" height="35" fill="#000" />
                  <rect x="99" y="0" width="4" height="35" fill="#000" />
                  <rect x="106" y="0" width="2" height="35" fill="#000" />
                  <rect x="111" y="0" width="5" height="35" fill="#000" />
                  <rect x="119" y="0" width="1" height="35" fill="#000" />
                  <rect x="123" y="0" width="3" height="35" fill="#000" />
                  <rect x="129" y="0" width="2" height="35" fill="#000" />
                  <rect x="134" y="0" width="4" height="35" fill="#000" />
                  <rect x="141" y="0" width="2" height="35" fill="#000" />
                  <rect x="146" y="0" width="3" height="35" fill="#000" />
                  <rect x="152" y="0" width="1" height="35" fill="#000" />
                  <rect x="156" y="0" width="5" height="35" fill="#000" />
                  <rect x="164" y="0" width="2" height="35" fill="#000" />
                  <rect x="169" y="0" width="3" height="35" fill="#000" />
                  <rect x="175" y="0" width="1" height="35" fill="#000" />
                  <rect x="179" y="0" width="4" height="35" fill="#000" />
                  <rect x="186" y="0" width="2" height="35" fill="#000" />
                  <rect x="191" y="0" width="3" height="35" fill="#000" />
                </svg>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '2px' }}>
                  *{currentTicket.saleNumber}*
                </div>
              </div>
            </div>
          </div>
        );
}
