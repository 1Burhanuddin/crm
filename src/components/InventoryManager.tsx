import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Package, Plus, Minus, AlertTriangle, Search, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface InventoryItem {
  id: string;
  product_id: string;
  quantity_in_stock: number;
  reorder_level: number;
  product?: Product;
}

export function InventoryManager() {
  const { user } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [initialStock, setInitialStock] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateType, setUpdateType] = useState<'add' | 'subtract' | 'set'>('add');

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchProducts();
    }
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;

    const { data: inventoryData, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id);

    if (inventoryData) {
      // Fetch product details separately for each inventory item
      const inventoryWithProducts = await Promise.all(
        inventoryData.map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product_id)
            .single();
          
          return {
            ...item,
            product: product as Product
          };
        })
      );
      
      setInventory(inventoryWithProducts);
    }

    if (error) {
      toast({
        title: 'Error loading inventory',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchProducts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setProducts(data);
    }

    if (error) {
      toast({
        title: 'Error loading products',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddInventoryItem = async () => {
    if (!user || !selectedProductId) return;

    setLoading(true);

    const { error } = await supabase
      .from('inventory')
      .insert({
        user_id: user.id,
        product_id: selectedProductId,
        quantity_in_stock: initialStock,
        reorder_level: reorderLevel,
      });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error adding inventory item',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Inventory item added successfully' });
      setShowAddModal(false);
      setSelectedProductId('');
      setInitialStock(0);
      setReorderLevel(10);
      fetchInventory();
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedItem || !user) return;

    setLoading(true);

    let newQuantity = selectedItem.quantity_in_stock;
    
    switch (updateType) {
      case 'add':
        newQuantity += updateQuantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - updateQuantity);
        break;
      case 'set':
        newQuantity = updateQuantity;
        break;
    }

    const { error } = await supabase
      .from('inventory')
      .update({ quantity_in_stock: newQuantity })
      .eq('id', selectedItem.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error updating stock',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Stock updated successfully' });
      setShowUpdateModal(false);
      setSelectedItem(null);
      setUpdateQuantity(0);
      fetchInventory();
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => 
    item.quantity_in_stock <= item.reorder_level
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track your product stock levels</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product to Inventory
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>
              {lowStockItems.length} product(s) are running low on stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="font-medium">{item.product?.name}</span>
                  <Badge variant="outline" className="text-orange-700">
                    {item.quantity_in_stock} {item.product?.unit} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map(item => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.product?.name}</CardTitle>
                  <CardDescription>₹{item.product?.price}/{item.product?.unit}</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowUpdateModal(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.quantity_in_stock <= item.reorder_level ? "destructive" : "secondary"}>
                      {item.quantity_in_stock} {item.product?.unit}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reorder Level:</span>
                  <span className="text-sm">{item.reorder_level} {item.product?.unit}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock Value:</span>
                  <span className="text-sm font-medium">
                    ₹{(item.quantity_in_stock * (item.product?.price || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Inventory Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Inventory</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => !inventory.find(i => i.product_id === p.id)).map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.price}/{product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_stock">Initial Stock Quantity</Label>
              <Input
                id="initial_stock"
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddInventoryItem} disabled={loading || !selectedProductId}>
                {loading ? 'Adding...' : 'Add to Inventory'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Stock Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedItem?.product?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Current Stock:</p>
              <p className="font-semibold">{selectedItem?.quantity_in_stock} {selectedItem?.product?.unit}</p>
            </div>

            <div className="space-y-2">
              <Label>Update Type</Label>
              <Select value={updateType} onValueChange={(value: 'add' | 'subtract' | 'set') => setUpdateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="subtract">Remove Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="update_quantity">
                {updateType === 'add' ? 'Quantity to Add' : 
                 updateType === 'subtract' ? 'Quantity to Remove' : 
                 'New Stock Level'}
              </Label>
              <Input
                id="update_quantity"
                type="number"
                min="0"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(Number(e.target.value))}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpdateStock} disabled={loading}>
                {loading ? 'Updating...' : 'Update Stock'}
              </Button>
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}