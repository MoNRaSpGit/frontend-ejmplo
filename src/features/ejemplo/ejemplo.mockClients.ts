// "Cliente" (cuenta corriente) a modo de prototipo: 3 clientes de prueba
// con historial inventado, todo en memoria (no se guarda en la base). Es
// a proposito -- el pedido fue "datos ficticios, que al recargar la
// pagina vuelva todo a como estaba" para poder probar el flujo (cobrar a
// cuenta, ver el historial, apretar "Pago" e imprimir el ticket) sin
// tocar clientes/cuentas reales todavia. El dia que se haga la version
// de verdad, esto se reemplaza por EjemploClient + los endpoints de
// account-entries que ya existen en el backend.
export type MockPurchase = {
  id: string;
  productName: string;
  amount: number;
  dateLabel: string;
};

export type MockClient = {
  id: string;
  name: string;
  purchases: MockPurchase[];
};

export function getInitialMockClients(): MockClient[] {
  return [
    {
      id: "mock-juan",
      name: "Juan",
      purchases: [
        { id: "mp-1", productName: "Capuccino grande", amount: 3.5, dateLabel: "12/08" },
        { id: "mp-2", productName: "Medialuna x2", amount: 2.4, dateLabel: "14/08" }
      ]
    },
    {
      id: "mock-maria",
      name: "Maria",
      purchases: [{ id: "mp-3", productName: "Cafe en grano 1kg", amount: 14, dateLabel: "10/08" }]
    },
    {
      id: "mock-pedro",
      name: "Pedro",
      purchases: [
        { id: "mp-4", productName: "Tostado jamon y queso", amount: 4.8, dateLabel: "13/08" },
        { id: "mp-5", productName: "Limonada natural", amount: 3, dateLabel: "13/08" }
      ]
    }
  ];
}

export function getMockClientTotal(client: MockClient) {
  return client.purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
}
