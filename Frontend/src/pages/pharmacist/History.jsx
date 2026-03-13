import PharmacistOrders from './Orders.jsx';

export default function PharmacistHistory() {
  return (
    <PharmacistOrders
      historyOnly
      title="Pharmacy Order History"
      description="Review completed, cancelled, and partially fulfilled medicine orders from the pharmacist history view."
    />
  );
}
