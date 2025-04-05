// src/app/account/reservations/[reservationId]/page.tsx
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { redirect } from 'next/navigation';
import UnifiedReservationDetails from '@/components/reservations//ReservasionDetails';

export const metadata: Metadata = {
  title: 'Reservation Details | CEDT Rentals',
  description: 'View details of your car reservation',
};

interface PageProps {
  params: {
    reservationId: string;
  };
}

export default async function CustomerReservationDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  // Redirect if not logged in
  if (!session) {
    redirect('/signin?callbackUrl=/account/reservations');
  }
  
  return (
    <UnifiedReservationDetails 
      reservationId={params.reservationId} 
      userType="customer"
      backUrl="/account/reservations" 
    />
  );
}