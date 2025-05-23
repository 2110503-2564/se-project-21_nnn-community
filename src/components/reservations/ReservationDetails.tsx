"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { getTierName } from "@/utils/tierUtils";
import { API_BASE_URL } from "@/config/apiConfig";
import { Check, X, Edit, ArrowLeft, Loader2 } from "lucide-react";
import ProviderDetail from "@/components/provider/providerDetail";
import RentalServices from "@/components/reservations/ShowRentalServices";
import ReservationDetailsCard from "./ReservationDetailsCard";

interface UnifiedReservationDetailsProps {
  reservationId: string;
  userType: "user" | "provider" | "admin";
  backUrl?: string;
}

export default function UnifiedReservationDetails({
  reservationId,
  userType,
  backUrl = "/account/reservations",
}: UnifiedReservationDetailsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State for rental data and loading
  const [rental, setRental] = useState<Rent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [services, setServices] = useState<Service[]>([]);
  const [userTier, setUserTier] = useState(0);

  // State for editing notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");

  // States for modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState<
    "confirm" | "complete" | "cancel" | null
  >(null);
  const handleRentalUpdate = async (updatedRental: Rent) => {
    try {
      // เก็บข้อมูลรถยนต์และลูกค้าจากข้อมูลเดิม
      const carData = typeof rental?.car === 'object' ? rental.car : null;
      const userData = typeof rental?.user === 'object' ? rental.user : null;
      
      // สร้างอ็อบเจกต์ใหม่สำหรับการอัพเดต
      let processedRental = { ...updatedRental };
      
      // ตรวจสอบว่าข้อมูลรถยนต์เป็น ID หรือไม่
      if (updatedRental.car && typeof updatedRental.car === 'string' && session?.user?.token) {
        if (carData) {
          // ถ้ามีข้อมูลรถยนต์เดิม ให้ใช้ข้อมูลเดิมไปก่อน
          processedRental.car = carData;
        } else {
          // ถ้าไม่มีข้อมูลรถยนต์เดิม ให้ดึงข้อมูลใหม่
          try {
            const carResponse = await fetch(
              `${API_BASE_URL}/cars/${updatedRental.car}`,
              {
                headers: {
                  Authorization: `Bearer ${session.user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
  
            if (carResponse.ok) {
              const carResponseData = await carResponse.json();
              if (carResponseData.success && carResponseData.data) {
                processedRental.car = carResponseData.data;
              }
            }
          } catch (error) {
            console.error("Error fetching car details after update:", error);
          }
        }
      }
      
      // ตรวจสอบข้อมูลผู้ใช้
      if (updatedRental.user && typeof updatedRental.user === 'string') {
        if (userData) {
          // ถ้ามีข้อมูลผู้ใช้เดิม ให้ใช้ข้อมูลเดิม
          processedRental.user = userData;
        }
      }
      
      // อัพเดต state ด้วยข้อมูลที่ประมวลผลแล้ว
      setRental(processedRental);
      setSuccess("Reservation updated successfully");
      
      // รีเฟรชข้อมูลบริการหากมีการเปลี่ยนแปลง
      if (processedRental.service && processedRental.service.length > 0) {
        fetchServices();
      }
    } catch (err) {
      console.error("Error processing updated rental:", err);
      // อัพเดตข้อมูลดิบในกรณีที่มีข้อผิดพลาด
      setRental(updatedRental);
      setSuccess("Reservation updated but some details may be incomplete");
    }
  };

  const fetchServices = async () => {
    if (
      !rental?.service ||
      rental.service.length === 0 ||
      !session?.user?.token
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/services`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        // Filter only the services that are in the rental's service array
        const rentalServices = data.data.filter((service: Service) =>
          rental.service?.includes(service._id)
        );

        setServices(rentalServices);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  useEffect(() => {
    // ตรวจสอบ editDetails=true ใน URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const editDetailsMode = url.searchParams.get("editDetails");

      if (editDetailsMode === "true") {
        // เปิดโหมดแก้ไขรายละเอียด
        setIsEditingDetails(true);

        // เลื่อนไปยังส่วน Reservation Details
        setTimeout(() => {
          const detailsElement = document.getElementById("reservation-details");
          if (detailsElement) {
            detailsElement.scrollIntoView({ behavior: "smooth" });
          }
        }, 500);
      }
    }
  }, []);

  //Fetch Cur User
  useEffect(() => {
    const fetchUserTier = async () => {
      if (session?.user?.token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/curuser`, {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUserTier(userData.data.tier || 0);
          }
        } catch (error) {
          console.error("Error fetching user tier:", error);
        }
      }
    };

    fetchUserTier();
  }, [session?.user?.token]);

  //Fetch Services
  useEffect(() => {
    if (rental?.service && rental.service.length > 0) {
      fetchServices();
    }
  }, [rental, session?.user?.token]);

  // Fetch rental details
  useEffect(() => {
    async function fetchRentalDetails() {
      // Check if session exists
      if (!session?.user?.token) {
        router.push("/signin?callbackUrl=" + backUrl);
        return;
      }

      setIsLoading(true);
      try {
        console.log(`Fetching reservation ID: ${reservationId}`);

        // Make API call to fetch reservation details
        const response = await fetch(`${API_BASE_URL}/rents/${reservationId}`, {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("API Response status:", response.status);

        if (!response.ok) {
          console.error(
            "Failed to fetch reservation details, status:",
            response.status
          );
          throw new Error("Failed to fetch reservation details");
        }

        const data = await response.json();
        console.log("API Response data:", data);

        if (!data.success || !data.data) {
          console.error("Invalid response format:", data);
          throw new Error("Received invalid data format from server");
        }

        // Process car data if needed (only if car is just an ID)
        if (typeof data.data.car === "string") {
          console.log("Car is an ID, fetching details:", data.data.car);
          try {
            const carResponse = await fetch(
              `${API_BASE_URL}/cars/${data.data.car}`,
              {
                headers: {
                  Authorization: `Bearer ${session.user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (carResponse.ok) {
              const carResponseData = await carResponse.json();
              if (carResponseData.success && carResponseData.data) {
                data.data.car = carResponseData.data;
              }
            }
          } catch (error) {
            console.error("Error fetching car details:", error);
          }
        }

        // Verify access based on user type
        if (userType === "provider") {
          // For providers: Check if this is their car
          const providerId = session.user.id || session.user._id;
          const carData = data.data.car;

          if (
            typeof carData === "object" &&
            carData.provider_id !== providerId
          ) {
            console.error(
              "Provider ID mismatch:",
              carData.provider_id,
              "vs",
              providerId
            );
            throw new Error(
              "You do not have permission to view this reservation"
            );
          }
        } else if (userType === "user") {
          // For customers: Check if this is their reservation
          const userId = session.user.id || session.user._id;
          const userData = data.data.user;
          const reservationUserId =
            typeof userData === "string" ? userData : userData?._id;

          if (reservationUserId !== userId) {
            console.error("User ID mismatch:", reservationUserId, "vs", userId);
            throw new Error(
              "You do not have permission to view this reservation"
            );
          }
        }

        // Admin: No checks needed, they can view all reservations
        console.log("Setting rental data after validation:", data.data);
        setRental(data.data);
        setEditedNotes(data.data.notes || "");
      } catch (err) {
        console.error("Error in fetching rental details:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.token) {
      fetchRentalDetails();
    }
  }, [
    reservationId,
    session?.user?.token,
    router,
    session?.user?.id,
    status,
    userType,
    backUrl,
  ]);

  // Handle updating notes
  const handleUpdateNotes = async () => {
    if (!session?.user?.token || !rental) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/rents/${reservationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: editedNotes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update notes");
      }

      // Update local state
      setRental((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          notes: editedNotes,
        };
      });

      setIsEditingNotes(false);
      setSuccess("Notes updated successfully");
    } catch (err) {
      console.error("Error updating notes:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };
  // Handle updating rental status
  const updateRentalStatus = async (
    action: "confirm" | "complete" | "cancel"
  ) => {
    if (!session?.user?.token || !rental) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Determine the endpoint based on the action
      let endpoint;
      let newStatus: "pending" | "active" | "completed" | "cancelled";
      let actionText;

      switch (action) {
        case "confirm":
          endpoint = `${API_BASE_URL}/rents/${reservationId}/confirm`;
          newStatus = "active";
          actionText = "confirmed";
          break;
        case "complete":
          endpoint = `${API_BASE_URL}/rents/${reservationId}/complete`;
          newStatus = "completed";
          actionText = "completed";
          break;
        case "cancel":
          endpoint = `${API_BASE_URL}/rents/${reservationId}/cancel`;
          newStatus = "cancelled";
          actionText = "cancelled";
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: rental.notes
            ? `${rental.notes}\n\n${
                action.charAt(0).toUpperCase() + action.slice(1)
              }ed by ${userType} on ${new Date().toLocaleString()}`
            : `${
                action.charAt(0).toUpperCase() + action.slice(1)
              }ed by ${userType} on ${new Date().toLocaleString()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} reservation`);
      }

      const data = await response.json();

      // Update the rental in state
      setRental((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          ...(data.data || {}),
        };
      });

      setSuccess(`Reservation ${actionText} successfully`);
    } catch (err) {
      console.error(`Error updating rental status:`, err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate rental period
  const calculateRentalPeriod = (startDate: string, returnDate: string) => {
    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(returnDate);

    // Reset to midnight to ignore time components
    const startDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // Calculate difference in days
    const timeDiff = endDay.getTime() - startDay.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Add 1 because rental period includes both start and end days
    return days + 1;
  };

  // Calculate late days and fees
  const calculateLateFees = (rentalData: Rent) => {
    if (!rentalData.actualReturnDate)
      return { daysLate: 0, lateFeePerDay: 0, totalLateFee: 0 };

    const expectedReturnDate = new Date(rentalData.returnDate);
    const actualReturnDate = new Date(rentalData.actualReturnDate);

    const daysLate = Math.max(
      0,
      Math.ceil(
        (actualReturnDate.getTime() - expectedReturnDate.getTime()) /
          (1000 * 3600 * 24)
      )
    );

    // Get tier from car if it's an object, otherwise use default
    const carTier =
      typeof rentalData.car === "object" ? rentalData.car.tier || 0 : 0;
    const lateFeePerDay = (carTier + 1) * 500;
    const totalLateFee = daysLate * lateFeePerDay;

    return { daysLate, lateFeePerDay, totalLateFee };
  };

  // Calculate service costs based on rental duration
  const calculateServiceCost = () => {
    if (!rental || !rental.service || rental.service.length === 0) {
      return 0;
    }

    // Get service IDs from the rental
    const serviceIds = rental.service;

    // Calculate rental period
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.returnDate);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
    );

    // Calculate total service cost
    let totalServiceCost = 0;
    for (const service of services) {
      if (serviceIds.includes(service._id)) {
        totalServiceCost += service.rate * days;
      }
    }

    return totalServiceCost;
  };

  const calculateTotalPrice = () => {
    if (!rental) return 0;

    const baseCost = rental.price || 0;
    const serviceCost = rental.servicePrice || 0;
    const additionalCharges = rental.additionalCharges?.lateFee || 0;
    const lateFees = daysLate > 0 ? totalLateFee : 0;

    return baseCost + serviceCost + additionalCharges + lateFees;
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle car image display more robustly
  const getCarImageUrl = (carData: Car | null): string => {
    if (!carData) return "/img/car-placeholder.jpg";

    // Case 1: car has images array with at least one entry
    if (
      carData.images &&
      Array.isArray(carData.images) &&
      carData.images.length > 0
    ) {
      const image = carData.images[0];

      // Check if the image is already a full URL
      if (typeof image === "string" && image.startsWith("http")) {
        return image;
      }

      // Check if it's a relative path that should be used as-is
      if (
        typeof image === "string" &&
        (image.startsWith("/") || image.includes("/"))
      ) {
        return image;
      }

      // Otherwise, assume it's a filename in the R2 bucket
      return `https://blob.ngixx.me/images/${image}`;
    }

    // Case 2: car has a single image property
    if (carData.image) {
      // If it's a full URL, use it as is
      if (
        typeof carData.image === "string" &&
        carData.image.startsWith("http")
      ) {
        return carData.image;
      }

      return carData.image;
    }

    // Default fallback
    return "/img/car-placeholder.jpg";
  };

  // Handle cancel reservation by customer
  const handleCancelReservation = async () => {
    if (!session?.user?.token) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Customer can only cancel pending reservations
      if (rental?.status !== "pending" && userType === "user") {
        throw new Error("You can only cancel pending reservations");
      }

      const response = await fetch(`${API_BASE_URL}/rents/${reservationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
          notes: rental?.notes
            ? `${
                rental.notes
              }\n\nCancelled by customer on ${new Date().toLocaleString()}`
            : `Cancelled by customer on ${new Date().toLocaleString()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel reservation");
      }

      // If this is a customer cancellation, we need to update the car availability
      if (userType === "user") {
        try {
          const carId =
            typeof rental?.car === "string" ? rental.car : rental?.car._id;
          if (carId) {
            await fetch(`${API_BASE_URL}/cars/${carId}`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${session.user.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ available: true }),
            });
          }
        } catch (carUpdateErr) {
          console.error("Error updating car availability:", carUpdateErr);
        }
      }

      // Update rental status in state
      setRental((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "cancelled",
        };
      });

      setSuccess("Reservation cancelled successfully");

      // Redirect for customers after cancellation
      if (userType === "user") {
        setTimeout(() => {
          router.push("/account/reservations");
        }, 2000);
      }
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
      setConfirmDelete(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="py-10 px-4 max-w-4xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8A7D55] inline-block"></div>
        <p className="mt-4">Loading reservation details...</p>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="py-10 px-4 max-w-4xl mx-auto">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => router.push(backUrl)}
            className="mt-4 px-4 py-2 bg-[#8A7D55] text-white rounded-md hover:bg-[#766b48]"
          >
            Back to Reservations
          </button>
        </div>
      </main>
    );
  }

  // No rental data
  if (!rental) {
    return (
      <main className="py-10 px-4 max-w-4xl mx-auto">
        <div className="bg-white p-10 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-medium text-red-600 mb-4">
            Reservation Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested reservation could not be retrieved.
          </p>
          <Link
            href={backUrl}
            className="px-4 py-2 bg-[#8A7D55] text-white rounded-md hover:bg-[#766b48] transition-colors"
          >
            Back to Reservations
          </Link>
        </div>
      </main>
    );
  }

  // Format car and user data
  const car = typeof rental.car === "object" ? rental.car : null;
  const user = typeof rental.user === "object" ? rental.user : null;

  // Get the car image URL
  const carImage = getCarImageUrl(car);

  // Calculate late fees if applicable
  const { daysLate, lateFeePerDay, totalLateFee } = calculateLateFees(rental);

  const ConfirmationModal = () => {
    if (!showConfirmModal || !modalAction) return null;
  
    const actionText: Record<typeof modalAction, string> = {
      confirm: "confirm reservation",
      complete: "complete reservation",
      cancel: "cancel reservation"
    };
  
    const actionTitle: Record<typeof modalAction, string> = {
      confirm: "Confirm Reservation",
      complete: "Complete Reservation",
      cancel: "Cancel Reservation"
    };
  
    const actionDescription: Record<typeof modalAction, string> = {
      confirm: "Are you sure you want to confirm this reservation?",
      complete: "Are you sure you want to mark this reservation as completed?",
      cancel: "Are you sure you want to cancel this reservation? This action cannot be undone."
    };
  
    const actionIcon: Record<typeof modalAction, JSX.Element> = {
      confirm: <Check className="w-6 h-6" />,
      complete: <Check className="w-6 h-6" />,
      cancel: <X className="w-6 h-6" />
    };
  
    const actionColor: Record<typeof modalAction, string> = {
      confirm: "bg-blue-100 text-blue-600",
      complete: "bg-green-100 text-green-600",
      cancel: "bg-red-100 text-red-600"
    };
  
    const buttonColor: Record<typeof modalAction, string> = {
      confirm: "bg-blue-600 hover:bg-blue-700",
      complete: "bg-green-600 hover:bg-green-700",
      cancel: "bg-red-600 hover:bg-red-700"
    };
  
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-xl max-w-md w-full shadow-2xl transform transition-all animate-slideUp">
          <div className="p-6">
            {/* Header with icon */}
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-full ${actionColor[modalAction]} flex items-center justify-center mr-3`}>
                {actionIcon[modalAction]}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {actionTitle[modalAction]}
              </h3>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 mb-6 ml-13">
              {actionDescription[modalAction]}
            </p>
  
            {/* Rental details for confirmation */}
            {car && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 ml-13">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Vehicle:</span>
                  <span className="ml-2">{car.brand} {car.model}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <span className="font-medium text-gray-700">License:</span>
                  <span className="ml-2">{car.license_plate}</span>
                </div>
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setModalAction(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalAction) {
                    updateRentalStatus(modalAction);
                  }
                  setShowConfirmModal(false);
                  setModalAction(null);
                }}
                disabled={isLoading}
                className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 flex items-center
                  ${buttonColor[modalAction]}
                  ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:transform hover:scale-105"}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 
                  ${modalAction === "cancel" 
                    ? "focus:ring-red-500" 
                    : modalAction === "complete"
                    ? "focus:ring-green-500"
                    : "focus:ring-blue-500"
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionIcon[modalAction]}
                    <span className="ml-2">
                      {actionText[modalAction].charAt(0).toUpperCase() + actionText[modalAction].slice(1)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <main className="py-10 px-4 max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.push(backUrl)}
            className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-medium font-serif">
            Reservation Details
          </h1>
        </div>

        <div className="mt-2 sm:mt-0">
          <span
            className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusBadgeClass(
              rental.status
            )}`}
          >
            {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column - Vehicle and Customer Info */}
        <div>
          {/* Vehicle details card */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-medium mb-4 text-[#8A7D55]">
              Vehicle Information
            </h2>

            {car ? (
              <div className="space-y-3">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 mb-4 rounded-md overflow-hidden">
                  <Image
                    src={carImage}
                    alt={`${car.brand} ${car.model}`}
                    width={400}
                    height={225}
                    className="object-cover"
                  />
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Brand/Model</p>
                  <p className="font-medium">
                    {car.brand} {car.model}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">License Plate</p>
                  <p className="font-medium">{car.license_plate}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Type/Color</p>
                  <p className="font-medium">
                    {car.type} / {car.color}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Daily Rate</p>
                  <p className="font-medium">{formatCurrency(car.dailyRate)}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Tier</p>
                  <p className="font-medium">
                    {getTierName(car.tier)} (Tier {car.tier})
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Vehicle details not available
              </p>
            )}
          </div>

          {/* Customer details - only shown to admin and provider */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-medium mb-4 text-[#8A7D55]">
              Customer Information
            </h2>

            {user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Phone Number</p>
                  <p className="font-medium">{user.telephone_number}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Customer ID</p>
                  <p className="text-sm text-gray-500">{user._id}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Customer details not available
              </p>
            )}
          </div>
          {/* Notes card */}
          <div
            id="reservation-notes"
            className="bg-white p-6 rounded-lg shadow-md mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-[#8A7D55]">Notes</h2>

              {/* Edit button - only shown for appropriate user types */}
              {((userType === "provider" && rental.status !== "cancelled") ||
                userType === "admin" ||
                (userType === "user" && rental.status === "pending")) &&
                !isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                )}
            </div>

            {isEditingNotes ? (
              <div>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#8A7D55]"
                  placeholder="Add notes about this reservation..."
                />

                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdateNotes}
                    className="px-3 py-1.5 bg-[#8A7D55] text-white rounded-md hover:bg-[#766b48] transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-[100px] text-gray-700 whitespace-pre-line">
                {rental.notes ? (
                  rental.notes
                ) : (
                  <span className="text-gray-400 italic">No notes added</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Rental Details and Actions */}
        <div>
          {rental && (
            <div id="reservation-details">
              <ReservationDetailsCard
                rental={rental}
                userType={userType}
                token={session?.user?.token || ""}
                onUpdate={handleRentalUpdate}
                calculateRentalPeriod={calculateRentalPeriod}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                formatTime={formatTime}
                calculateServiceCost={calculateServiceCost}
                calculateTotalPrice={calculateTotalPrice}
                daysLate={daysLate}
                totalLateFee={totalLateFee}
                userTier={userTier}
                isEditing={isEditingDetails}
                setIsEditing={setIsEditingDetails}
              />
            </div>
          )}
          {/* Rental Services */}
          <div className="mb-6">
            {rental.service && rental.service.length > 0 && (
              <RentalServices
                token={session?.user?.token || ""}
                serviceIds={rental.service}
              />
            )}
          </div>

          {/* Provider Details */}
          <div className="mb-6">
            {" "}
            {/* Added pb-8 for padding-bottom */}
            {car?.provider_id && (
              <ProviderDetail
                providerId={car?.provider_id}
                token={session?.user?.token}
              />
            )}
          </div>

          {/* Action buttons - dynamic based on user type and rental status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-medium mb-4 text-[#8A7D55]">Actions</h2>

            <div className="grid grid-cols-1 gap-3">
              {/* Provider-specific actions */}
              {userType === "provider" && (
                <>
                  {rental.status === "pending" && (
                    <button
                      onClick={() => {
                        setModalAction("confirm");
                        setShowConfirmModal(true);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <Check size={18} className="mr-2" />
                      Confirm Reservation
                    </button>
                  )}

                  {rental.status === "active" && (
                    <button
                      onClick={() => {
                        setModalAction("complete");
                        setShowConfirmModal(true);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} className="mr-2" />
                      Complete Reservation
                    </button>
                  )}

                  {(rental.status === "pending" ||
                    rental.status === "active") && (
                    <button
                      onClick={() => {
                        setModalAction("cancel");
                        setShowConfirmModal(true);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <X size={18} className="mr-2" />
                      Cancel Reservation
                    </button>
                  )}
                </>
              )}

              {/* Admin-specific actions */}
              {userType === "admin" && (
                <>
                  {rental.status === "pending" && (
                    <button
                      onClick={() => {
                        setModalAction("confirm");
                        setShowConfirmModal(true);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <Check size={18} className="mr-2" />
                      Confirm Reservation
                    </button>
                  )}

                  {rental.status === "active" && (
                    <button
                      onClick={() => {
                        setModalAction("complete");
                        setShowConfirmModal(true);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} className="mr-2" />
                      Complete Reservation
                    </button>
                  )}

                  {(rental.status === "pending" ||
                    rental.status === "active") && (
                    <button
                      onClick={() => {
                        setModalAction("cancel");
                        setShowConfirmModal(true);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <X size={18} className="mr-2" />
                      Cancel Reservation
                    </button>
                  )}
                </>
              )}

              {/* Customer-specific actions */}
              {userType === "user" && (
                <>
                  {rental.status === "pending" && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <X size={18} className="mr-2" />
                      Cancel Reservation
                    </button>
                  )}

                  {confirmDelete && (
                    <div className="mt-3 p-4 border border-red-300 bg-red-50 rounded-md">
                      <p className="text-red-700 mb-3">
                        Are you sure you want to cancel this reservation? This
                        action cannot be undone.
                      </p>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          No, Keep It
                        </button>
                        <button
                          onClick={handleCancelReservation}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <X size={16} className="mr-2" />
                              Yes, Cancel
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* "No actions available" message */}
              {(userType === "provider" || userType === "admin") &&
                (rental.status === "completed" ||
                  rental.status === "cancelled") && (
                  <p className="text-center text-gray-500 py-2">
                    No actions available for {rental.status} reservations
                  </p>
                )}

              {/* Back button for all user types */}
              <Link
                href={backUrl}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to All Reservations
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmationModal />
    </main>
  );
}
