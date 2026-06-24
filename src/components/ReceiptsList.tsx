import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertCircle, ShoppingBag, Landmark, ChevronDown, ChevronUp, FileText, MapPin } from "lucide-react";
import { Order } from "../types";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface ReceiptsListProps {
  userId: string;
}

export default function ReceiptsList({ userId }: ReceiptsListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const path = "orders";
    try {
      // Real-time Firestore sync of the customer's orders
      const q = query(
        collection(db, path),
        where("userId", "==", userId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedOrders: Order[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          
          // Sort dynamically in-memory to bypass composite index requirements
          fetchedOrders.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          setOrders(fetchedOrders);
          setLoading(false);
        },
        (err) => {
          console.error("Failed to sync personal orders:", err);
          try {
            handleFirestoreError(err, OperationType.LIST, path);
          } catch (mappedError: any) {
            setError(mappedError.message || "Could not retrieve orders. Please check database permissions.");
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error("Personal orders fetch exception:", err);
      setError("Database connection error. Try logging in again.");
      setLoading(false);
    }
  }, [userId]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4" id="receipts-list-container">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-sans font-bold text-gray-800 tracking-tight">
            My Receipts &amp; Orders
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Track bKash reference verification status for your orders.
          </p>
        </div>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500 mt-3 font-medium">Retrieving transaction logs...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-800 text-xs leading-relaxed">
          <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Sync Interrupted</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-emerald-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-700">No Orders Placed Yet</h3>
          <p className="text-gray-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
            Your personal receipts ledger is currently empty. Head over to our Menu tab and order some of our fresh, green organic bowls!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const isPaid = order.paymentStatus === "paid";

          return (
            <div 
              key={order.id}
              className={`bg-white/60 backdrop-blur-lg border rounded-2xl overflow-hidden transition-all duration-200 ${
                isExpanded ? "border-white/80 shadow-lg bg-white/75" : "border-white/40 hover:border-white/80 shadow-sm"
              }`}
              id={`order-log-${order.id}`}
            >
              {/* Summary Bar */}
              <div 
                onClick={() => toggleExpand(order.id)}
                className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none bg-emerald-50/10 hover:bg-emerald-50/30"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-lg shrink-0 ${isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-pulse" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Ref: <span className="font-mono text-emerald-800 text-sm">{order.referenceNumber}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-emerald-950 block">
                      ${order.totalPrice.toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-sans font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      isPaid 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded Receipt Details */}
              {isExpanded && (
                <div className="p-5 border-t border-emerald-50 bg-gray-50/50 space-y-4">
                  
                  {/* bKash metadata instructions */}
                  <div className="bg-white border border-emerald-100 rounded-lg p-3.5 flex gap-2.5 text-[11px] leading-relaxed text-gray-600">
                    <Landmark className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-800 block mb-0.5">bKash Transaction Details:</span>
                      <span>
                        Transferred to merchant: <strong className="font-mono text-emerald-800">01721938899</strong> using Reference Code: <strong className="font-mono text-amber-800">{order.referenceNumber}</strong>. If your payment is sent, our support team will update this log to <strong className="text-emerald-800 font-bold">"paid"</strong>.
                      </span>
                    </div>
                  </div>

                  {order.address && (
                    <div className="bg-white border border-emerald-100 rounded-lg p-3.5 flex gap-2.5 text-[11px] leading-relaxed text-gray-600">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-800 block mb-0.5">Delivery Address:</span>
                        <span className="text-gray-700">{order.address}</span>
                      </div>
                    </div>
                  )}

                  {/* List of itemized items */}
                  <div>
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Dish details
                    </span>
                    <div className="bg-white border border-emerald-50 rounded-lg divide-y divide-emerald-50/50">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-gray-800 block">{item.name}</span>
                            <span className="font-mono text-[10px] text-gray-400">${item.price.toFixed(2)} each</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-medium text-gray-500 block">x{item.quantity}</span>
                            <span className="font-mono font-bold text-emerald-950">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                    <span>Document ID: {order.id}</span>
                    <span className="font-sans text-xs font-bold text-emerald-900">
                      Total: <span className="font-mono text-sm font-black text-emerald-800">${order.totalPrice.toFixed(2)}</span>
                    </span>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
