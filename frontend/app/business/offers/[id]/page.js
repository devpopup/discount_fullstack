"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BusinessLayout from "@/components/BusinessLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Pause,
  Play,
  Trash,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  Users,
  Tag,
  DollarSign,
  Clock,
  MapPin,
  Eye,
  Activity,
} from "lucide-react";

// Import API functions
import { getOffer, pauseOffer, resumeOffer, deleteOffer } from "@/lib/offers";
import { getImageUrl } from "@/lib/api";

export default function OfferDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const offerId = params.id;

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [pauseDialog, setPauseDialog] = useState({
    isOpen: false,
    isActive: false,
    action: "",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    isDeleting: false,
  });

  useEffect(() => {
    if (user && user.is_business && offerId) {
      fetchOffer();
    }
  }, [user, offerId]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOffer(offerId);
      if (!result.success) {
        setError(result.error || "Failed to fetch offer");
        return;
      }

      // Process image URLs
      const processedOffer = {
        ...result.offer,
        image_url: getImageUrl(result.offer.image_url),
        product: result.offer.product
          ? {
              ...result.offer.product,
              image_url: getImageUrl(result.offer.product.image_url),
            }
          : null,
      };

      setOffer(processedOffer);
    } catch (error) {
      console.error("Error fetching offer:", error);
      setError("Failed to load offer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/business/offers/${offerId}/edit`);
  };

  const handleBackToOffers = () => {
    router.push("/business/offers");
  };

  const handleBackToProduct = () => {
    if (offer?.product?.id) {
      router.push(`/business/products/${offer.product.id}/offers`);
    } else {
      router.push("/business/offers");
    }
  };

  // Pause/Resume offer with confirmation
  const openPauseDialog = (isActive) => {
    setPauseDialog({
      isOpen: true,
      isActive,
      action: isActive ? "pause" : "resume",
    });
  };

  const closePauseDialog = () => {
    if (!actionLoading) {
      setPauseDialog({
        isOpen: false,
        isActive: false,
        action: "",
      });
    }
  };

  const handleConfirmPauseResume = async () => {
    try {
      setActionLoading(true);

      const result = pauseDialog.isActive
        ? await pauseOffer(offerId)
        : await resumeOffer(offerId);

      if (result.success) {
        await fetchOffer(); // Refresh offer data
        closePauseDialog();
      } else {
        setError(`Failed to ${pauseDialog.action} offer: ` + result.error);
        closePauseDialog();
      }
    } catch (error) {
      console.error(`Error ${pauseDialog.action} offer:`, error);
      setError(`Error ${pauseDialog.action} offer`);
      closePauseDialog();
    } finally {
      setActionLoading(false);
    }
  };

  // Delete offer with confirmation
  const openDeleteDialog = () => {
    setDeleteDialog({
      isOpen: true,
      isDeleting: false,
    });
  };

  const closeDeleteDialog = () => {
    if (!deleteDialog.isDeleting) {
      setDeleteDialog({
        isOpen: false,
        isDeleting: false,
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

      const result = await deleteOffer(offerId);

      if (result.success) {
        // Redirect to offers list after successful deletion
        router.push("/business/offers");
      } else {
        setError("Failed to delete offer: " + result.error);
        closeDeleteDialog();
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      setError("Error deleting offer");
      closeDeleteDialog();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDiscountDisplay = (offer) => {
    switch (offer.discount_type) {
      case "percentage":
        return `${offer.discount_value}% off`;
      case "fixed":
        return `$${parseFloat(offer.discount_value).toFixed(2)} off`;
      case "minimum_purchase":
        return `$${parseFloat(offer.discount_value).toFixed(
          2
        )} off orders over $${parseFloat(offer.minimum_purchase_amount).toFixed(
          2
        )}`;
      case "quantity_discount":
        return `${offer.discount_value}% off when buying ${offer.minimum_quantity}+ items`;
      case "bogo":
        const discountText =
          offer.get_discount_percentage === 100
            ? "FREE"
            : `${offer.get_discount_percentage}% off`;
        return `Buy ${offer.buy_quantity}, get ${offer.get_quantity} ${discountText}`;
      default:
        return "Special Offer";
    }
  };

  const getStatusInfo = (offer) => {
    const now = new Date();
    const startDate = new Date(offer.start_date);
    const endDate = new Date(offer.expiry_date);

    if (!offer.is_active) {
      return { status: "paused", color: "bg-yellow-500", label: "Paused" };
    } else if (now < startDate) {
      return { status: "scheduled", color: "bg-blue-500", label: "Scheduled" };
    } else if (now > endDate) {
      return { status: "expired", color: "bg-red-500", label: "Expired" };
    } else {
      return { status: "active", color: "bg-green-500", label: "Active" };
    }
  };

  if (!user || !user.is_business) {
    return null;
  }

  if (loading) {
    return (
      <BusinessLayout
        title="Loading Offer..."
        subtitle="Please wait while we load the offer details"
        activeTab="offers"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-3 text-gray-600">Loading offer details...</span>
        </div>
      </BusinessLayout>
    );
  }

  if (error) {
    return (
      <BusinessLayout
        title="Error"
        subtitle="Unable to load offer details"
        activeTab="offers"
      >
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Offer
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleBackToOffers}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offers
            </Button>
            <Button
              onClick={fetchOffer}
              className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  if (!offer) {
    return (
      <BusinessLayout
        title="Offer Not Found"
        subtitle="The requested offer could not be found"
        activeTab="offers"
      >
        <div className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Offer Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The offer you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={handleBackToOffers}
            className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offers
          </Button>
        </div>
      </BusinessLayout>
    );
  }

  const statusInfo = getStatusInfo(offer);

  return (
    <BusinessLayout
      title={offer.title || "Offer Details"}
      subtitle="View and manage offer details"
      activeTab="offers"
    >
      {/* Navigation */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleBackToOffers}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offers
        </Button>
        {offer.product && (
          <Button
            variant="outline"
            onClick={handleBackToProduct}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Package className="h-4 w-4 mr-2" />
            Product Offers
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Offer Header */}
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {offer.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-white font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </Badge>
                    <span className="text-lg font-semibold text-[#e94e1b]">
                      {getDiscountDisplay(offer)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="border-[#e94e1b] text-[#e94e1b] hover:bg-[#e94e1b] hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  {statusInfo.status === "active" ||
                  statusInfo.status === "scheduled" ? (
                    <Button
                      variant="outline"
                      onClick={() => openPauseDialog(true)}
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : statusInfo.status === "paused" ? (
                    <Button
                      variant="outline"
                      onClick={() => openPauseDialog(false)}
                      className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    onClick={openDeleteDialog}
                    className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {offer.description && (
                <p className="text-gray-600 leading-relaxed">
                  {offer.description}
                </p>
              )}
            </CardContent>
          </Card>


          {/* Product Information */}
          {offer.product && (
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#e94e1b]" />
                  Associated Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {offer.product.image_url ? (
                      <img
                        src={offer.product.image_url}
                        alt={offer.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {offer.product.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {offer.product.price && (
                        <span>
                          Price: ${parseFloat(offer.product.price).toFixed(2)}
                        </span>
                      )}
                      {offer.product.category && (
                        <span>Category: {offer.product.category.name}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/business/products/${offer.product.id}/offers`
                      )
                    }
                    size="sm"
                  >
                    View Product Offers
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          {offer.terms_conditions && (
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#e94e1b]" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {offer.terms_conditions}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {/* Offer Statistics */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#e94e1b]" />
                Offer Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Claims</span>
                </div>
                <span className="font-semibold">
                  {offer.current_claims || 0}
                  {offer.max_claims ? ` / ${offer.max_claims}` : ""}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Start Date</span>
                </div>
                <span className="text-sm font-medium">
                  {formatDate(offer.start_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">End Date</span>
                </div>
                <span className="text-sm font-medium">
                  {formatDate(offer.expiry_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Offer Type</span>
                </div>
                <span className="text-sm font-medium">
                  {offer.discount_type
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <span className="text-sm font-medium">
                  {formatDateTime(offer.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Discount Details */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#e94e1b]" />
                Discount Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {offer.discount_type === "percentage" && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {offer.discount_value}%
                  </div>
                  <div className="text-sm text-green-700">
                    Percentage Discount
                  </div>
                </div>
              )}

              {offer.discount_type === "fixed" && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${parseFloat(offer.discount_value).toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700">Fixed Amount Off</div>
                </div>
              )}

              {offer.discount_type === "minimum_purchase" && (
                <div className="space-y-2">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      ${parseFloat(offer.discount_value).toFixed(2)} off
                    </div>
                    <div className="text-sm text-purple-700">
                      On orders over $
                      {parseFloat(offer.minimum_purchase_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {offer.discount_type === "quantity_discount" && (
                <div className="space-y-2">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {offer.discount_value}% off
                    </div>
                    <div className="text-sm text-orange-700">
                      When buying {offer.minimum_quantity}+ items
                    </div>
                  </div>
                </div>
              )}

              {offer.discount_type === "bogo" && (
                <div className="space-y-2">
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      Buy {offer.buy_quantity}, Get {offer.get_quantity}
                    </div>
                    <div className="text-sm text-red-700">
                      {offer.get_discount_percentage === 100
                        ? "FREE"
                        : `${offer.get_discount_percentage}% off`}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pause/Resume Confirmation Dialog */}
      <AlertDialog open={pauseDialog.isOpen} onOpenChange={closePauseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pauseDialog.action === "pause" ? (
                <Pause className="h-5 w-5 text-yellow-600" />
              ) : (
                <Play className="h-5 w-5 text-green-600" />
              )}
              {pauseDialog.action === "pause" ? "Pause Offer" : "Resume Offer"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pauseDialog.action} this offer?
              {pauseDialog.action === "pause"
                ? " Customers will no longer be able to claim this offer until you resume it."
                : " Customers will be able to claim this offer again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closePauseDialog}
              disabled={actionLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPauseResume}
              disabled={actionLoading}
              className={
                pauseDialog.action === "pause"
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {pauseDialog.action === "pause"
                    ? "Pausing..."
                    : "Resuming..."}
                </>
              ) : (
                <>
                  {pauseDialog.action === "pause" ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {pauseDialog.action === "pause"
                    ? "Pause Offer"
                    : "Resume Offer"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Delete Offer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{offer.title}"</strong>?
              This action cannot be undone and will permanently remove the offer
              and all associated claims.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeDeleteDialog}
              disabled={deleteDialog.isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteDialog.isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Offer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BusinessLayout>
  );
}
