{/* ================= BLOQUE 2: PROYECCIÓN DE AGOTAMIENTO DE STOCK (DÍAS DE INVENTARIO) ================= */}
      <div className="clay-card p-3.5 sm:p-6 space-y-3 sm:space-y-4 border-2 border-amber-200/70 bg-gradient-to-br from-white to-amber-50/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="font-extrabold text-xs sm:text-base text-slate-800 flex items-center gap-1.5 sm:gap-2">
                <Hourglass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                <span>Proyección de Agotamiento de Stock (Días)</span>
              </h3>
              <span className="text-[9px] sm:text-[10px] font-black uppercase bg-rose-100 text-rose-800 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                Alerta Reabastecimiento
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Días de existencias para cada contratipo según el ritmo diario de ventas
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('compras')}
              className="clay-btn clay-btn-light px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Compras & Proveedores</span>
            </button>
          )}
        </div>

        {/* Tarjetas de Proyección de Días Restantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-1">
          {proyeccionAgotamiento.slice(0, 6).map((item) => {
            const isCritical = item.urgency === 'CRITICO';
            const isWarning = item.urgency === 'ALERTA';
            return (
              <div
                key={item.id}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                  isCritical
                    ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                    : isWarning
                    ? 'bg-amber-50/80 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-black text-slate-900 text-xs sm:text-sm block truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium truncate">
                      Proveedor: {item.supplier}
                    </span>
                  </div>
                  <span
                    className={`text-[9.5px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                      isCritical
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isCritical ? 'Reorden Urgente' : isWarning ? 'Atención' : 'Stock OK'}
                  </span>
                </div>

                {/* Contador Central de Días */}
                <div className="my-2 sm:my-3 flex items-baseline justify-between">
                  <div>
                    <span
                      className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                        isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {item.daysLeft > 180 ? '>180' : item.daysLeft}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 ml-1.5">
                      {item.daysLeft === 1 ? 'día restante' : 'días restantes'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-xs font-extrabold text-slate-800 block font-mono">
                      {item.stock} {item.unit}s
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">en bodega</span>
                  </div>
                </div>

                {/* Velocidad de Consumo y Sugerencia */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="text-slate-500 font-medium truncate pr-1">
                    Consumo: <strong className="text-slate-800 font-mono">{item.dailyRate} Oz/d</strong>
                  </span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                    Pedir: +{item.reorderSuggestion} Oz
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      