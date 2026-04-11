# Pruebas de API (cURL)

## 1. Login (Obtener Cookie)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}' \
  -v 
# Nota: Extrae la cookie 'auth-token' e inclúyela en los siguientes requests manualmente o mediante Postman.
```

## 2. Crear un Producto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=AQUÍ_EL_TOKEN_OBTENIDO" \
  -d '{"name": "Producto de Ejemplo MVP"}'
```

## 3. Crear una Variante
```bash
# Reemplazar PRODUCT_ID con el ID devuelto en el paso 2
curl -X POST http://localhost:3000/api/products/PRODUCT_ID/variants \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=AQUÍ_EL_TOKEN_OBTENIDO" \
  -d '{"name": "Variante Especial", "currentPrice": 1500.00, "minimumStock": 5}'
```

## 4. Registro de Movimiento de Stock (Ingreso - IN)
```bash
# Reemplazar VARIANT_ID con el ID devuelto en el paso 3
curl -X POST http://localhost:3000/api/stock/movements \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=AQUÍ_EL_TOKEN_OBTENIDO" \
  -d '{"variantId": "VARIANT_ID", "type": "IN", "quantity": 100}'
```

## 5. Confirmar Venta
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=AQUÍ_EL_TOKEN_OBTENIDO" \
  -d '{
    "lines": [
      { "variantId": "VARIANT_ID", "quantity": 3 }
    ]
  }'
```

## 6. Cancelar / Anular Venta
```bash
# Reemplazar SALE_ID con el ID devuelto en el paso 5
curl -X POST http://localhost:3000/api/sales/SALE_ID/cancel \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=AQUÍ_EL_TOKEN_OBTENIDO" \
  -d '{"cancellationReason": "El pedido fue devuelto por el cliente"}'
```

## 7. Dashboard Stats / Indicadores
```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Cookie: auth-token=AQUÍ_EL_TOKEN_OBTENIDO"
```
