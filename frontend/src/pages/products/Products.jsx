import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import ProductCard from '../../components/product/ProductCard';
import ProductFilters from '../../components/product/ProductFilters';
import Pagination from '../../components/common/Pagination';
import BidModal from '../../components/order/BidModal';
import EnquiryModal from '../../components/order/EnquiryModal';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer, isDealer, isAdmin } = useAuth();
  const toast = useToast();
  const query = new URLSearchParams(location.search);

  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: query.get('search') || '',
    brand: query.get('brand') || '',
    category: query.get('category') || '',
    page: 0, size: 20
  });
  const [bidProduct, setBidProduct] = useState(null);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { fetchProducts(); }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts(filters);
      setProducts(res.data?.data || []);
      setTotalElements(res.data?.totalElements || 0);
      setTotalPages(res.data?.totalPages || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const handleWishlist = async (product) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isCustomer) { toast.error('Only customers can add products to wishlist'); return; }
    try {
      await orderService.addToWishlist({ productId: product.id, productName: product.name, partNumber: product.partNumber, brand: product.brand, quantity: 1 });
      toast.success('✅ Added to wishlist!');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add to wishlist'); }
  };

  const handleBid = (product) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isDealer) { toast.error('Only dealers can place bids'); return; }
    setBidProduct(product);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar filters */}
      {sidebarOpen && (
        <div style={{ width: 260, background: 'white', borderRight: '1px solid #e2e8f0', padding: 24, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>🔍 Filters</h3>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
          </div>
          <ProductFilters filters={filters} onChange={setFilters} />
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!sidebarOpen && (
              <button className="btn btn-outline btn-sm" onClick={() => setSidebarOpen(true)}>☰ Filters</button>
            )}
            <h2 style={{ fontWeight: 800, fontSize: 20, color: '#1e293b' }}>
              Products {!loading && <span style={{ color: '#64748b', fontWeight: 500, fontSize: 15 }}>({totalElements} results)</span>}
            </h2>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={40} /></div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#94a3b8' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No products found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
              {products.map(p => (
                <ProductCard key={p.id} product={p}
                  onWishlist={handleWishlist}
                  onBid={handleBid}
                  onEnquiry={isAuthenticated ? setEnquiryProduct : () => navigate('/login')}
                  isCustomer={isCustomer}
                  isDealer={isDealer}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
            <Pagination page={filters.page} totalPages={totalPages} onChange={p => setFilters({ ...filters, page: p })} />
          </>
        )}
      </div>

      {bidProduct && <BidModal product={bidProduct} onClose={() => setBidProduct(null)} onSuccess={fetchProducts} />}
      {enquiryProduct && <EnquiryModal product={enquiryProduct} onClose={() => setEnquiryProduct(null)} />}
    </div>
  );
}
