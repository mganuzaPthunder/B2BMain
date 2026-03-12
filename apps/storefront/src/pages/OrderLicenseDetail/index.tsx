import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
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
  status: boolean; // true = Redeemed, false = Active
  emailSent: string | null;
  jsonData: string | null;
}

const ORDERS_API =
  "https://uninfluential-linh-overcunningly.ngrok-free.dev/api/orders/user";

function formatTimestamp(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function OrderLicenseDetail() {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();

  const companyState = useAppSelector((s) => s.company);
  const b2bState = useAppSelector((s) => s.b2bFeatures);

  const customerId =
    companyState?.customer?.id ||
    companyState?.companyInfo?.id ||
    b2bState?.masqueradeCompany?.id ||
    null;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>(
    {}
  );
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [email, setEmail] = useState("");

  const dialogContainer =
    typeof window !== "undefined"
      ? (document.getElementById("b3-root") ?? document.body)
      : undefined;

  const goBack = () => navigate(-1);

  useEffect(() => {
    if (!customerId || !orderId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${ORDERS_API}/${customerId}`);
        if (!res.ok) throw new Error("Failed to fetch license records.");

        const data: Order[] = await res.json();
        const filtered = data.filter((x) => String(x.orderId) === String(orderId));
        setOrders(filtered);
      } catch (err) {
        console.error("License detail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, orderId]);

  const handleDownloadCSV = () => {
    const selected = orders.filter((o) => selectedItems[o.id] && !o.status);
    if (selected.length === 0) return;

    const header = ["Item No", "Title", "Product Key", "Timestamp", "Status"];
    const rows = selected.map((o) => [
      o.productId || o.itemNumber,
      o.productTitle.replace(/"/g, '""'),
      o.productKey ?? "",
      formatTimestamp(o.timeStampSent),
      o.status ? "Redeemed" : "Active",
    ]);

    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((v) => (v.includes(",") || v.includes('"') ? `"${v}"` : v))
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `license_keys_${orderId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenDialog = (order: Order) => {
    setSelectedOrder(order);
    setEmail(order.emailSent ?? "");
    setOpenDialog(true);
  };

  const handleSend = () => {
    // No real send logic yet – just a placeholder
    console.log("Send key clicked for:", selectedOrder, "to:", email);
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading…</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Title + actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Typography variant="h5">License Keys #{orderId}</Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            disabled={selectedCount === 0}
            onClick={handleDownloadCSV}
            sx={{
              backgroundColor: "#d9534f",
              "&:hover": { backgroundColor: "#c9302c" },
              textTransform: "none",
            }}
          >
            Download ({selectedCount})
          </Button>
          <Button
            variant="outlined"
            sx={{
              textTransform: "none",
              borderColor: "#d9534f",
              color: "#d9534f",
              "&:hover": {
                borderColor: "#c9302c",
                backgroundColor: "rgba(217,83,79,0.08)",
              },
            }}
            onClick={() => console.log("Reorder clicked (no function yet)")}
          >
            Reorder
          </Button>
        </Box>
      </Box>

      <Button
        onClick={goBack}
        size="small"
        sx={{ textTransform: "none", mb: 2 }}
      >
        ← Back
      </Button>

      {orders.length === 0 ? (
        <Typography>No license keys found for this order.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={0}>
          <Table
            sx={{
              "& td, & th": {
                borderBottom: "none !important",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      orders.some((o) => !o.status) &&
                      orders
                        .filter((o) => !o.status)
                        .every((o) => selectedItems[o.id])
                    }
                    indeterminate={
                      orders.some((o) => !o.status && selectedItems[o.id]) &&
                      !orders
                        .filter((o) => !o.status)
                        .every((o) => selectedItems[o.id])
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const next: Record<number, boolean> = {};
                      orders.forEach((o) => {
                        if (!o.status) {
                          next[o.id] = checked;
                        }
                      });
                      setSelectedItems(next);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <strong>Item No.</strong>
                </TableCell>
                <TableCell colSpan={5}>
                  <strong>Title</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>

                  {/* Row 1: Main */}
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={!!selectedItems[order.id]}
                        disabled={order.status}
                        onChange={(e) =>
                          setSelectedItems((prev) => ({
                            ...prev,
                            [order.id]: e.target.checked,
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>{order.productId || order.itemNumber}</TableCell>
                    <TableCell colSpan={5}>{order.productTitle}</TableCell>
                  </TableRow>

                  {/* Row 2: Details */}
                  <TableRow>
                    <TableCell />
                    <TableCell><b>Product key</b></TableCell>
                    <TableCell>{order.productKey || "—"}</TableCell>
                    <TableCell><b>Time stamp</b></TableCell>
                    <TableCell>{formatTimestamp(order.timeStampSent)}</TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell>{order.status ? "Redeemed" : "Active"}</TableCell>
                  </TableRow>

                  {/* Row 3: Action */}
                  <TableRow>
                    <TableCell />
                    <TableCell colSpan={6} sx={{ py: 2 }}>
                      <Button
                        variant="contained"
                        disabled={order.status}
                        onClick={() => handleOpenDialog(order)}
                        sx={{
                          backgroundColor: "#d9534f",
                          "&:hover": { backgroundColor: "#c9302c" },
                          textTransform: "none",
                        }}
                      >
                        SEND KEY
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* ➜ Separator Row */}
                  <TableRow className="item-separator">
                    <TableCell colSpan={7} />
                  </TableRow>

                </React.Fragment>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      )}

      {/* Send Key Dialog (no real send logic yet) */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        container={dialogContainer}
        disablePortal
        keepMounted
        fullWidth
        maxWidth="sm"
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
