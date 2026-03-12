import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
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
  status: boolean; // false = Active/Available, true = Redeemed
  emailSent: string | null;
  jsonData: string | null;
}

const ORDERS_API_BASE =
  "https://uninfluential-linh-overcunningly.ngrok-free.dev/api/orders/user";

const formatDate = (value: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const formatTimestamp = (value: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export default function OrderLicense() {
  const navigate = useNavigate();

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

  // filters
  const [orderNoFilter, setOrderNoFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");

  // selected rows by item id
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      setError("Customer not logged in");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${ORDERS_API_BASE}/${customerId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch orders (${res.status})`);
        }
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err: any) {
        console.error("❌ Error fetching orders:", err);
        setError(err.message ?? "Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customerId]);

  // derived: filtered list by order number + date range
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    return orders.filter((o) => {
      if (orderNoFilter.trim() && !String(o.orderId).includes(orderNoFilter.trim())) {
        return false;
      }

      if (fromFilter) {
        const fromDate = new Date(fromFilter);
        const orderDate = new Date(o.orderDate);
        if (!Number.isNaN(fromDate.getTime()) && orderDate < fromDate) {
          return false;
        }
      }

      if (toFilter) {
        const toDate = new Date(toFilter);
        const orderDate = new Date(o.orderDate);
        if (!Number.isNaN(toDate.getTime())) {
          // include entire day
          toDate.setHours(23, 59, 59, 999);
          if (orderDate > toDate) return false;
        }
      }

      return true;
    });
  }, [orders, orderNoFilter, fromFilter, toFilter]);

  // group by orderId
  const groupedByOrder = useMemo(() => {
    const map: Record<string, Order[]> = {};
    filteredOrders.forEach((o) => {
      if (!map[o.orderId]) map[o.orderId] = [];
      map[o.orderId].push(o);
    });

    // sort each group by id or item number if needed
    Object.values(map).forEach((group) =>
      group.sort((a, b) => a.id - b.id)
    );

    // sort groups by orderDate desc
    return Object.entries(map).sort(([, a], [, b]) => {
      const d1 = new Date(a[0]?.orderDate ?? "").getTime();
      const d2 = new Date(b[0]?.orderDate ?? "").getTime();
      return d2 - d1;
    });
  }, [filteredOrders]);

  // flat list of visible items for header checkbox logic
  const visibleItems = useMemo(
    () => groupedByOrder.flatMap(([, group]) => group),
    [groupedByOrder]
  );

  const activeVisibleItems = visibleItems.filter((o) => !o.status);
  const selectedActiveCount = activeVisibleItems.filter(
    (o) => selectedItems[o.id]
  ).length;

  const allActiveSelected =
    activeVisibleItems.length > 0 &&
    selectedActiveCount === activeVisibleItems.length;

  const someActiveSelected =
    selectedActiveCount > 0 && !allActiveSelected;

  const handleHeaderCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    const next: Record<number, boolean> = { ...selectedItems };
    activeVisibleItems.forEach((item) => {
      next[item.id] = checked;
    });
    setSelectedItems(next);
  };

  const handleRowCheckboxChange = (
    orderId: number,
    checked: boolean
  ) => {
    setSelectedItems((prev) => ({
      ...prev,
      [orderId]: checked,
    }));
  };

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    // filters already applied via state; nothing else needed
  };

  const handleDownloadKeys = () => {
    const selected = visibleItems.filter(
      (o) => selectedItems[o.id] && !o.status
    );
    if (!selected.length) return;

    const header = [
      "Order No",
      "Order Date",
      "Item number",
      "Title",
      "Last sent email",
      "Product key",
      "Timestamp",
      "Status",
    ];

    const rows = selected.map((o) => [
      o.orderId,
      formatDate(o.orderDate),
      o.productId || o.itemNumber,
      o.productTitle.replace(/"/g, '""'),
      o.productKey ?? "",
      formatTimestamp(o.timeStampSent),
      o.status ? "Shipped" : "Not Shipped",
    ]);

    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((v) =>
            String(v).includes(",") || String(v).includes('"')
              ? `"${String(v)}"`
              : String(v)
          )
          .join(",")
      )
      .join("\n");

    // -------------------------------
    // Generate dynamic filename
    // -------------------------------
    const firstOrderNo = selected[0].orderId;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    const filename = `keys_${firstOrderNo}_${timestamp}.csv`;

    // -------------------------------
    // Download CSV
    // -------------------------------
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // ⬅️ dynamic file name here
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    // future: bulk submit selected items to email service
    const selectedIds = Object.entries(selectedItems)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    console.log("Submit clicked for ids:", selectedIds);
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/order-license-detail/${orderId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Search filters */}
      <Box
        component="form"
        onSubmit={handleSearchClick}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Order no.
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={orderNoFilter}
            onChange={(e) => setOrderNoFilter(e.target.value)}
          />
        </Box>

        <Box sx={{ minWidth: 180 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            From
          </Typography>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box sx={{ minWidth: 180 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            To
          </Typography>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box sx={{ alignSelf: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#d9534f",
              "&:hover": { backgroundColor: "#c9302c" },
              px: 4,
            }}
          >
            SEARCH
          </Button>
        </Box>
      </Box>

      {/* Title + top-right buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">License Keys</Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleDownloadKeys}
            disabled={selectedActiveCount === 0}
            sx={{
              textTransform: "none",
              borderColor: "#ccc",
              color: "#333",
              "&:hover": {
                borderColor: "#aaa",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Download Keys
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              textTransform: "none",
              backgroundColor: "#111827",
              "&:hover": { backgroundColor: "#030712" },
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>

      {!isB2BUser && (
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 1 }}
        >
          (Not a B2B user — may not have company orders)
        </Typography>
      )}

      {visibleItems.length === 0 ? (
        <Typography>No license keys found.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={0}>
          <Table
            sx={{
              "& thead th": {
                borderBottom: "2px solid #ddd !important",
              },
              "& tbody td": {
                borderBottom: "none",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someActiveSelected}
                    checked={allActiveSelected}
                    onChange={handleHeaderCheckboxChange}
                  />
                </TableCell>
                <TableCell>
                  <strong>Product</strong>
                </TableCell>
                <TableCell>
                  <strong>Order Date</strong>
                </TableCell>
                <TableCell>
                  <strong>Item number</strong>
                </TableCell>
                <TableCell>
                  <strong>Title</strong>
                </TableCell>
                <TableCell>
                  <strong>Last sent email</strong>
                </TableCell>
                <TableCell>
                  <strong>Product key</strong>
                </TableCell>
                <TableCell>
                  <strong>Time stamp</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {groupedByOrder.map(([orderId, items]) => {
                const first = items[0];
                const orderDate = formatDate(first.orderDate);

                return (
                  <React.Fragment key={orderId}>
                    {items.map((item, idx) => (
                      <TableRow key={item.id}>
                        {/* checkbox */}
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={!!selectedItems[item.id]}
                            disabled={item.status} // redeemed cannot be selected
                            onChange={(e) =>
                              handleRowCheckboxChange(
                                item.id,
                                e.target.checked
                              )
                            }
                          />
                        </TableCell>

                        {/* Product / order number (only first row shows link) */}
                        <TableCell>
                          {idx === 0 ? (
                            <Button
                              variant="text"
                              onClick={() => handleOrderClick(orderId)}
                              sx={{
                                p: 0,
                                minWidth: "auto",
                                textTransform: "none",
                                color: "#d9534f",
                                textDecoration: "underline",
                              }}
                            >
                              {orderId}
                            </Button>
                          ) : (
                            ""
                          )}
                        </TableCell>

                        {/* Order date only on first row of group */}
                        <TableCell>{idx === 0 ? orderDate : ""}</TableCell>

                        {/* Item number */}
                        <TableCell>{item.productId || item.itemNumber}</TableCell>

                        {/* Title (can wrap multiple lines) */}
                        <TableCell>{item.productTitle}</TableCell>

                        {/* Last sent email */}
                        <TableCell>{item.emailSent ?? ""}</TableCell>

                        {/* Product key */}
                        <TableCell>{item.productKey ?? ""}</TableCell>

                        {/* Timestamp */}
                        <TableCell>
                          {formatTimestamp(item.timeStampSent)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {item.status ? (
                            <Chip
                              label="Redeemed"
                              color="default"
                              size="small"
                              sx={{ fontSize: 12 }}
                            />
                          ) : (
                            <Chip
                              label="Active"
                              color="success"
                              size="small"
                              sx={{ fontSize: 12 }}
                            />
                          )}
                        </TableCell>

                        {/* Email text field (for future submit use) */}
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder=""
                            defaultValue={item.emailSent ?? ""}
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* separator between orders */}
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        sx={{ borderBottom: "2px solid #ddd", p: 0 }}
                      />
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
