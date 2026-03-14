import PharmacistOrders from './Orders.jsx';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function PharmacistHistory() {
  return (
    <PharmacistOrders
      historyOnly
      title="Pharmacy Order History"
      description="Review completed, cancelled, and partially fulfilled medicine orders from the pharmacist history view."
    />
  );
}
