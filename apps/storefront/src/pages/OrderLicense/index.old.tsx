import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Collapse,
  Box,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useAppSelector } from "@/store";

interface Order {
  id: number;
  userId: string;
  orderDate: string;
  productId: string;
  orderId: string;
  itemNumber: string;
  productTitle: string;
  productKey: string | null;
  productLink: string | null;
  timeStampSent: string | null;
  status: boolean; // false = Available
  emailSent: string | null;
  jsonData: string | null;
}

export default function OrderLicense() {
  const companyState = useAppSelector((state) => state.company);
  const b2bState = useAppSelector((state) => state.b2bFeatures);

  const customerId =
    companyState?.customer?.id ||
    companyState?.companyInfo?.id ||
    b2bState?.masqueradeCompany?.id ||
    null;

  const isB2BUser =
    !!companyState?.companyInfo?.companyName ||
    !!b2bState?.masqueradeCompany?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      setError("Customer not logged in");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `https://uninfluential-linh-overcunningly.ngrok-free.dev/api/orders/user/${customerId}`
        );
        if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);

        const data: Order[] = await res.json();
        console.log("✅ Parsed orders:", data);
        setOrders(data);
      } catch (err: any) {
        console.error("❌ Error fetching orders:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customerId]);

  const handleOpenDialog = (order: Order) => {
    setSelectedOrder(order);
    setEmail("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSend = () => {
    console.log("📤 Sending key to:", email);
    console.log("Order:", selectedOrder);
    setOpenDialog(false);
  };

  const dialogContainer =
    typeof window !== "undefined" ? document.body : undefined;

  // ✅ Group by orderId
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.orderId]) acc[order.orderId] = [];
    acc[order.orderId].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  if (loading)
    return (
      <div className="flex justify-center items-center p-8">
        <CircularProgress />
      </div>
    );

  if (error)
    return (
      <Typography color="error" className="p-6">
        Error: {error}
      </Typography>
    );

  return (
    <div className="p-6">
      {!isB2BUser && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          (Not a B2B user — may not have company orders)
        </Typography>
      )}

      {orders.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Order Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedOrders).map(([orderId, orderItems]) => (
                <CollapsibleOrderRow
                  key={orderId}
                  orderId={orderId}
                  orderItems={orderItems}
                  handleOpenDialog={handleOpenDialog}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        container={dialogContainer}
        disablePortal
        keepMounted
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send License Key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Product: <strong>{selectedOrder?.productTitle}</strong>
          </Typography>
          <TextField
            label="Recipient Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// ✅ Collapsible row component
function CollapsibleOrderRow({
  orderId,
  orderItems,
  handleOpenDialog,
}: {
  orderId: string;
  orderItems: Order[];
  handleOpenDialog: (order: Order) => void;
}) {
  const [open, setOpen] = useState(false);
  const orderDate = new Date(orderItems[0].orderDate).toLocaleDateString();

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{orderId}</TableCell>
        <TableCell>{orderDate}</TableCell>
        <TableCell>
          {orderItems.every((item) => item.status)
            ? "All Redeemed"
            : "Active"}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={4} sx={{ paddingBottom: 0, paddingTop: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Item No.</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Last Sent Email</strong></TableCell>
                    <TableCell><strong>Product Key</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.productId}</TableCell>
                      <TableCell>{order.productTitle}</TableCell>
                      <TableCell>{order.emailSent}</TableCell>
                      <TableCell>{order.productKey || "—"}</TableCell>
                      <TableCell>
                        {order.status === false ? (
                          <Chip
                            label="Available"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip label="Redeemed" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          disabled={order.status !== false}
                          onClick={() => handleOpenDialog(order)}
                        >
                          Send Key
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
