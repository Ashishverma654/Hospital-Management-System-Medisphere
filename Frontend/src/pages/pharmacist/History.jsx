import PharmacistOrders from './Orders.jsx';

import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function PharmacistHistory() {
  return (
    <PharmacistOrders
      historyOnly
      title="Pharmacy Order History"
      description="Review completed, cancelled, and partially fulfilled medicine orders from the pharmacist history view."
    />
  );
}
