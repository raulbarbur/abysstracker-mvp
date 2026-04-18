import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.SEED_USERNAME
  const password = process.env.SEED_PASSWORD

  if (!username || !password) {
    console.error('SEED_USERNAME and SEED_PASSWORD must be provided in the environment variables')
    process.exit(1)
  }

  // --- Limpiar datos de prueba existentes (orden respeta FK) ---
  console.log('🗑️  Limpiando datos existentes...')
  await prisma.invoice.deleteMany()
  await prisma.saleLine.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.authLog.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.product.deleteMany()

  // --- Usuario ---
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, passwordHash, active: true },
  })
  console.log(`✅ Usuario: ${user.username}`)

  // --- Productos y variantes ---
  const products = [
    // CIGARRILLOS
    {
      name: 'Cigarrillos Marlboro',
      variants: [
        { name: 'x20 unidades', currentPrice: 5800, costPrice: 4200, currentStock: 25, minimumStock: 5 },
        { name: 'x10 unidades', currentPrice: 3000, costPrice: 2200, currentStock: 20, minimumStock: 5 },
      ],
    },
    {
      name: 'Cigarrillos Camel',
      variants: [
        { name: 'x20 unidades', currentPrice: 5500, costPrice: 4000, currentStock: 20, minimumStock: 5 },
        { name: 'x10 unidades', currentPrice: 2900, costPrice: 2100, currentStock: 15, minimumStock: 5 },
      ],
    },
    {
      name: 'Cigarrillos Lucky Strike',
      variants: [
        { name: 'x20 unidades', currentPrice: 5300, costPrice: 3800, currentStock: 18, minimumStock: 5 },
        { name: 'x10 unidades', currentPrice: 2800, costPrice: 2000, currentStock: 14, minimumStock: 5 },
      ],
    },
    {
      name: 'Cigarrillos Nevada',
      variants: [
        { name: 'x20 unidades', currentPrice: 4000, costPrice: 2900, currentStock: 30, minimumStock: 10 },
        { name: 'x10 unidades', currentPrice: 2100, costPrice: 1550, currentStock: 25, minimumStock: 10 },
      ],
    },

    // BEBIDAS
    {
      name: 'Coca-Cola',
      variants: [
        { name: '500ml', currentPrice: 1800, costPrice: 1200, currentStock: 24, minimumStock: 6 },
        { name: '1.5L',  currentPrice: 3400, costPrice: 2300, currentStock: 12, minimumStock: 3 },
        { name: '2.25L', currentPrice: 4500, costPrice: 3100, currentStock: 8,  minimumStock: 3 },
      ],
    },
    {
      name: 'Sprite',
      variants: [
        { name: '500ml', currentPrice: 1700, costPrice: 1100, currentStock: 18, minimumStock: 6 },
        { name: '1.5L',  currentPrice: 3200, costPrice: 2100, currentStock: 10, minimumStock: 3 },
      ],
    },
    {
      name: 'Fanta',
      variants: [
        { name: '500ml Naranja',   currentPrice: 1700, costPrice: 1100, currentStock: 18, minimumStock: 6 },
        { name: '500ml Lima Limón', currentPrice: 1700, costPrice: 1100, currentStock: 12, minimumStock: 6 },
      ],
    },
    {
      name: 'Manaos',
      variants: [
        { name: '500ml',  currentPrice: 1000, costPrice: 650,  currentStock: 24, minimumStock: 6 },
        { name: '2.25L',  currentPrice: 2200, costPrice: 1400, currentStock: 12, minimumStock: 3 },
      ],
    },
    {
      name: 'Agua Mineral Villavicencio',
      variants: [
        { name: '500ml', currentPrice: 900,  costPrice: 600,  currentStock: 24, minimumStock: 6 },
        { name: '1.5L',  currentPrice: 1800, costPrice: 1200, currentStock: 12, minimumStock: 3 },
      ],
    },
    {
      name: 'Gatorade',
      variants: [
        { name: '500ml Limón',   currentPrice: 2300, costPrice: 1600, currentStock: 12, minimumStock: 4 },
        { name: '500ml Naranja', currentPrice: 2300, costPrice: 1600, currentStock: 10, minimumStock: 4 },
      ],
    },

    // ALFAJORES
    {
      name: 'Alfajor Jorgito',
      variants: [
        { name: 'Chocolate', currentPrice: 850, costPrice: 580, currentStock: 30, minimumStock: 10 },
        { name: 'Blanco',    currentPrice: 850, costPrice: 580, currentStock: 25, minimumStock: 10 },
      ],
    },
    {
      name: 'Alfajor Capitán del Espacio',
      variants: [
        { name: 'Chocolate', currentPrice: 900, costPrice: 620, currentStock: 25, minimumStock: 10 },
        { name: 'Blanco',    currentPrice: 900, costPrice: 620, currentStock: 20, minimumStock: 10 },
      ],
    },
    {
      name: 'Alfajor Havanna',
      variants: [
        { name: 'Chocolate x2', currentPrice: 3200, costPrice: 2300, currentStock: 12, minimumStock: 4 },
        { name: 'Blanco x2',    currentPrice: 3200, costPrice: 2300, currentStock: 10, minimumStock: 4 },
      ],
    },
    {
      name: 'Alfajor Milka',
      variants: [
        { name: 'Triple Chocolate', currentPrice: 1500, costPrice: 1050, currentStock: 18, minimumStock: 6 },
      ],
    },

    // SNACKS
    {
      name: 'Ranchos',
      variants: [
        { name: 'Individual 67g', currentPrice: 850,  costPrice: 580,  currentStock: 20, minimumStock: 8 },
        { name: 'Grande 120g',    currentPrice: 1500, costPrice: 1050, currentStock: 12, minimumStock: 4 },
      ],
    },
    {
      name: 'Cheetos',
      variants: [
        { name: 'Individual 67g', currentPrice: 850,  costPrice: 580,  currentStock: 20, minimumStock: 8 },
        { name: 'Grande 115g',    currentPrice: 1500, costPrice: 1050, currentStock: 10, minimumStock: 4 },
      ],
    },
    {
      name: 'Pepitos',
      variants: [
        { name: '100g', currentPrice: 700, costPrice: 480, currentStock: 15, minimumStock: 5 },
      ],
    },
    {
      name: 'Pringles',
      variants: [
        { name: 'Original 137g',    currentPrice: 3200, costPrice: 2200, currentStock: 10, minimumStock: 3 },
        { name: 'Crema y Cebolla',  currentPrice: 3200, costPrice: 2200, currentStock: 8,  minimumStock: 3 },
      ],
    },

    // CHOCOLATES
    {
      name: 'Milka',
      variants: [
        { name: 'Oreo 55g',      currentPrice: 1800, costPrice: 1250, currentStock: 15, minimumStock: 5 },
        { name: 'Almendras 55g', currentPrice: 1800, costPrice: 1250, currentStock: 12, minimumStock: 5 },
        { name: 'Chocolate 55g', currentPrice: 1700, costPrice: 1180, currentStock: 14, minimumStock: 5 },
      ],
    },
    {
      name: 'Bon o Bon',
      variants: [
        { name: 'Caja x16 leche',  currentPrice: 3500, costPrice: 2500, currentStock: 10, minimumStock: 4 },
        { name: 'Caja x16 blanco', currentPrice: 3500, costPrice: 2500, currentStock: 8,  minimumStock: 4 },
      ],
    },
    {
      name: 'Shot Chocolate',
      variants: [
        { name: 'Leche',  currentPrice: 700, costPrice: 480, currentStock: 20, minimumStock: 8 },
        { name: 'Blanco', currentPrice: 700, costPrice: 480, currentStock: 18, minimumStock: 8 },
      ],
    },

    // GOLOSINAS
    {
      name: 'Beldent',
      variants: [
        { name: 'Menta',        currentPrice: 550, costPrice: 370, currentStock: 20, minimumStock: 8 },
        { name: 'Tutti Frutti', currentPrice: 550, costPrice: 370, currentStock: 20, minimumStock: 8 },
        { name: 'Menta Fuerte', currentPrice: 550, costPrice: 370, currentStock: 15, minimumStock: 8 },
      ],
    },
    {
      name: 'Sugus',
      variants: [
        { name: 'Surtido x4',  currentPrice: 450, costPrice: 300, currentStock: 30, minimumStock: 10 },
        { name: 'Frutilla x4', currentPrice: 450, costPrice: 300, currentStock: 25, minimumStock: 10 },
      ],
    },
    {
      name: 'Mentitas',
      variants: [
        { name: 'Caja', currentPrice: 400, costPrice: 270, currentStock: 25, minimumStock: 10 },
      ],
    },
    {
      name: 'Mogul',
      variants: [
        { name: 'Surtido',  currentPrice: 400, costPrice: 270, currentStock: 30, minimumStock: 10 },
        { name: 'Frutilla', currentPrice: 400, costPrice: 270, currentStock: 25, minimumStock: 10 },
      ],
    },
    {
      name: 'Palitos de la Selva',
      variants: [
        { name: 'Caja 45g', currentPrice: 600, costPrice: 410, currentStock: 20, minimumStock: 8 },
      ],
    },
  ]

  console.log('\n📦 Creando productos...')
  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            currentPrice: v.currentPrice,
            costPrice: v.costPrice,
            currentStock: v.currentStock,
            minimumStock: v.minimumStock,
          })),
        },
      },
    })
    console.log(`  📦 ${p.name} (${p.variants.length} variantes)`)
  }

  // --- Construir lookup de variantes ---
  const allVariants = await prisma.variant.findMany({ include: { product: true } })
  const vMap = Object.fromEntries(
    allVariants.map((v) => [`${v.product.name}|${v.name}`, v])
  )
  const get = (product: string, variant: string) => {
    const key = `${product}|${variant}`
    if (!vMap[key]) throw new Error(`Variante no encontrada: ${key}`)
    return vMap[key]
  }

  // --- Movimientos IN de stock inicial (28 de marzo) ---
  console.log('\n📥 Creando movimientos de ingreso inicial...')
  const stockDate = new Date('2026-03-28T09:00:00Z')
  for (const variant of allVariants) {
    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        type: 'IN',
        quantity: variant.currentStock,
        reason: 'Carga inicial de stock',
        userId: user.id,
        createdAt: stockDate,
      },
    })
  }
  console.log(`  ✅ ${allVariants.length} movimientos de ingreso creados`)

  // --- Ventas de abril 2026 ---
  console.log('\n🛒 Creando ventas...')

  const salesData = [
    {
      date: '2026-04-01T10:15:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Marlboro', variant: 'x20 unidades', qty: 1 },
        { product: 'Coca-Cola', variant: '500ml', qty: 1 },
      ],
    },
    {
      date: '2026-04-01T14:30:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Alfajor Jorgito', variant: 'Chocolate', qty: 2 },
        { product: 'Sprite', variant: '500ml', qty: 1 },
        { product: 'Beldent', variant: 'Menta', qty: 1 },
      ],
    },
    {
      date: '2026-04-02T09:45:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Camel', variant: 'x20 unidades', qty: 1 },
        { product: 'Mentitas', variant: 'Caja', qty: 2 },
      ],
    },
    {
      date: '2026-04-02T16:20:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Ranchos', variant: 'Individual 67g', qty: 3 },
        { product: 'Coca-Cola', variant: '500ml', qty: 2 },
      ],
    },
    {
      date: '2026-04-03T11:00:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Pringles', variant: 'Original 137g', qty: 1 },
        { product: 'Gatorade', variant: '500ml Limón', qty: 2 },
        { product: 'Pepitos', variant: '100g', qty: 1 },
      ],
    },
    {
      date: '2026-04-04T10:30:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Lucky Strike', variant: 'x20 unidades', qty: 1 },
        { product: 'Agua Mineral Villavicencio', variant: '500ml', qty: 1 },
      ],
    },
    {
      date: '2026-04-05T12:15:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Alfajor Havanna', variant: 'Chocolate x2', qty: 2 },
        { product: 'Milka', variant: 'Oreo 55g', qty: 1 },
      ],
    },
    {
      date: '2026-04-06T09:00:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Marlboro', variant: 'x10 unidades', qty: 2 },
        { product: 'Mentitas', variant: 'Caja', qty: 3 },
        { product: 'Manaos', variant: '500ml', qty: 1 },
      ],
    },
    {
      date: '2026-04-07T15:45:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Manaos', variant: '500ml', qty: 4 },
        { product: 'Cheetos', variant: 'Individual 67g', qty: 2 },
        { product: 'Sugus', variant: 'Surtido x4', qty: 2 },
      ],
    },
    {
      date: '2026-04-08T11:30:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Bon o Bon', variant: 'Caja x16 leche', qty: 1 },
        { product: 'Shot Chocolate', variant: 'Leche', qty: 3 },
        { product: 'Coca-Cola', variant: '500ml', qty: 2 },
      ],
    },
    {
      date: '2026-04-09T10:00:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Coca-Cola', variant: '1.5L', qty: 2 },
        { product: 'Ranchos', variant: 'Grande 120g', qty: 1 },
        { product: 'Alfajor Jorgito', variant: 'Blanco', qty: 2 },
      ],
    },
    {
      date: '2026-04-10T13:00:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Sugus', variant: 'Surtido x4', qty: 3 },
        { product: 'Mogul', variant: 'Surtido', qty: 3 },
        { product: 'Palitos de la Selva', variant: 'Caja 45g', qty: 2 },
        { product: 'Beldent', variant: 'Tutti Frutti', qty: 2 },
      ],
    },
    {
      date: '2026-04-11T09:30:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Nevada', variant: 'x20 unidades', qty: 1 },
        { product: 'Agua Mineral Villavicencio', variant: '500ml', qty: 2 },
        { product: 'Alfajor Capitán del Espacio', variant: 'Chocolate', qty: 1 },
      ],
    },
    {
      date: '2026-04-12T16:00:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Cigarrillos Camel', variant: 'x10 unidades', qty: 1 },
        { product: 'Fanta', variant: '500ml Naranja', qty: 2 },
        { product: 'Beldent', variant: 'Menta Fuerte', qty: 1 },
      ],
    },
    {
      date: '2026-04-13T11:45:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Marlboro', variant: 'x20 unidades', qty: 2 },
        { product: 'Sprite', variant: '1.5L', qty: 1 },
      ],
    },
    {
      date: '2026-04-14T10:15:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Cheetos', variant: 'Grande 115g', qty: 1 },
        { product: 'Pringles', variant: 'Crema y Cebolla', qty: 1 },
        { product: 'Gatorade', variant: '500ml Naranja', qty: 1 },
        { product: 'Coca-Cola', variant: '500ml', qty: 1 },
      ],
    },
    {
      date: '2026-04-15T12:30:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Alfajor Milka', variant: 'Triple Chocolate', qty: 3 },
        { product: 'Milka', variant: 'Almendras 55g', qty: 2 },
        { product: 'Bon o Bon', variant: 'Caja x16 blanco', qty: 1 },
      ],
    },
    // Venta cancelada
    {
      date: '2026-04-15T17:00:00Z',
      paymentMethod: 'CASH' as const,
      status: 'CANCELLED' as const,
      cancellationReason: 'El cliente se arrepintió',
      lines: [
        { product: 'Cigarrillos Lucky Strike', variant: 'x20 unidades', qty: 1 },
        { product: 'Coca-Cola', variant: '500ml', qty: 2 },
      ],
    },
    {
      date: '2026-04-16T09:00:00Z',
      paymentMethod: 'CASH' as const,
      lines: [
        { product: 'Cigarrillos Nevada', variant: 'x10 unidades', qty: 2 },
        { product: 'Manaos', variant: '500ml', qty: 2 },
        { product: 'Ranchos', variant: 'Individual 67g', qty: 2 },
      ],
    },
    {
      date: '2026-04-17T10:45:00Z',
      paymentMethod: 'TRANSFER' as const,
      lines: [
        { product: 'Alfajor Capitán del Espacio', variant: 'Blanco', qty: 3 },
        { product: 'Mentitas', variant: 'Caja', qty: 2 },
        { product: 'Shot Chocolate', variant: 'Blanco', qty: 2 },
      ],
    },
  ]

  let salesCount = 0
  let cancelledCount = 0

  for (const saleData of salesData) {
    const isCancelled = saleData.status === 'CANCELLED'
    const saleDate = new Date(saleData.date)

    const sale = await prisma.sale.create({
      data: {
        userId: user.id,
        status: isCancelled ? 'CANCELLED' : 'ACTIVE',
        paymentMethod: saleData.paymentMethod,
        date: saleDate,
        ...(isCancelled && {
          cancellationReason: saleData.cancellationReason,
          cancellationDate: saleDate,
          cancelledByUserId: user.id,
        }),
        saleLines: {
          create: saleData.lines.map((line) => ({
            variantId: get(line.product, line.variant).id,
            quantity: line.qty,
            unitPrice: get(line.product, line.variant).currentPrice,
          })),
        },
      },
    })

    // Movimientos OUT solo para ventas activas
    if (!isCancelled) {
      for (const line of saleData.lines) {
        await prisma.stockMovement.create({
          data: {
            variantId: get(line.product, line.variant).id,
            type: 'OUT',
            quantity: line.qty,
            referenceId: sale.id,
            referenceType: 'SALE',
            userId: user.id,
            createdAt: saleDate,
          },
        })
      }
      salesCount++
    } else {
      cancelledCount++
    }
  }

  console.log(`  ✅ ${salesCount} ventas activas, ${cancelledCount} cancelada`)
  console.log(`\n✅ Seed completado: ${products.length} productos, ${allVariants.length} variantes, ${salesData.length} ventas`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
