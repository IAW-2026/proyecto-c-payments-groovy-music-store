-- CreateTable
CREATE TABLE "Transaccion" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL,
    "costoEnvio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comision" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_acreditar" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "transaccion_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acreditacion" (
    "id" TEXT NOT NULL,
    "transaccion_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "Acreditacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reclamo" (
    "id" TEXT NOT NULL,
    "transaccion_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "monto_reembolso" DOUBLE PRECISION,
    "evidencia_comprador" TEXT,

    CONSTRAINT "Reclamo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_transaccion_id_fkey" FOREIGN KEY ("transaccion_id") REFERENCES "Transaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acreditacion" ADD CONSTRAINT "Acreditacion_transaccion_id_fkey" FOREIGN KEY ("transaccion_id") REFERENCES "Transaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamo" ADD CONSTRAINT "Reclamo_transaccion_id_fkey" FOREIGN KEY ("transaccion_id") REFERENCES "Transaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
