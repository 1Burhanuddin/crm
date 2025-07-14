import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

export default function QuotationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotation() {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotations")
        .select("*, customers(name, phone), products(*)")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setError("Quotation not found");
        setQuotation(null);
      } else {
        setQuotation(data);
        setError(null);
      }
      setLoading(false);
    }
    if (id) fetchQuotation();
  }, [id]);

  if (loading) return <AppLayout title="Quotation Details"><div className="p-8 text-center">Loading...</div></AppLayout>;
  if (error) return <AppLayout title="Quotation Details"><div className="p-8 text-center text-red-600">{error}</div></AppLayout>;
  if (!quotation) return null;

  return (
    <AppLayout title="Quotation Details">
      <div className="p-4 max-w-xl mx-auto">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Back</Button>
        <h2 className="text-2xl font-bold mb-2">Quotation #{quotation.id}</h2>
        <div className="mb-2 text-gray-700">Customer: {quotation.customers?.name || quotation.customer_id}</div>
        <div className="mb-2 text-gray-700">Phone: {quotation.customers?.phone || "-"}</div>
        <div className="mb-2 text-gray-700">Date: {quotation.job_date}</div>
        <div className="mb-2 text-gray-700">Status: {quotation.status}</div>
        <div className="mb-2 text-gray-700">Product: {quotation.product_id}</div>
        <div className="mb-2 text-gray-700">Quantity: {quotation.qty}</div>
      </div>
    </AppLayout>
  );
} 