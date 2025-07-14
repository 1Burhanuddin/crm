import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name, phone), products")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setError("Order not found");
        setOrder(null);
      } else {
        setOrder(data);
        setError(null);
      }
      setLoading(false);
    }
    if (id) fetchOrder();
  }, [id]);

  if (loading) return <AppLayout title="Order Details"><div className="p-8 text-center">Loading...</div></AppLayout>;
  if (error) return <AppLayout title="Order Details"><div className="p-8 text-center text-red-600">{error}</div></AppLayout>;
  if (!order) return null;

  return (
    <AppLayout title="Order Details">
      <div className="p-4 max-w-xl mx-auto">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Back</Button>
        <h2 className="text-2xl font-bold mb-2">Order #{order.id}</h2>
        <div className="mb-2 text-gray-700">Customer: {order.customers?.name || order.customer_id}</div>
        <div className="mb-2 text-gray-700">Phone: {order.customers?.phone || "-"}</div>
        <div className="mb-2 text-gray-700">Date: {order.job_date}</div>
        <div className="mb-2 text-gray-700">Status: {order.status}</div>
        <div className="mb-2 text-gray-700">Products:</div>
        <ul className="list-disc ml-6">
          {Array.isArray(order.products) && order.products.length > 0 ? order.products.map((p: any, i: number) => (
            <li key={i}>Product ID: {p.productId || p.product_id}, Qty: {p.qty}</li>
          )) : <li>No products</li>}
        </ul>
      </div>
    </AppLayout>
  );
} 