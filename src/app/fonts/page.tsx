'use client';

import { useFonts } from '@/hooks/useFonts';
import FontCard from '../../components/FontCard';
import PageContainer from '../../components/PageContainer';
import SectionHeading from '../../components/SectionHeading';
import Button from '../../components/Button';
import Link from 'next/link';

export default function FontsPage() {
  const { fonts, loading, error, refetch } = useFonts();

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Fonts
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={refetch} variant="danger">
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <SectionHeading
            title="All Fonts"
            description="Explore all available fonts in the platform"
          />
          <Link href="/fonts/new">
            <Button>Create New Font</Button>
          </Link>
        </div>

        {/* Fonts Grid */}
        {fonts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No fonts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be the first to create a font for the platform.
              </p>
              <Link href="/fonts/new">
                <Button>Create Your First Font</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fonts.map((font) => (
              <FontCard key={font.id} font={font} />
            ))}
          </div>
        )}

        {/* Stats */}
        {fonts.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {fonts.length} font{fonts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
