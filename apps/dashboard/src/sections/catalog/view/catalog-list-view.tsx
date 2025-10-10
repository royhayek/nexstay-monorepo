'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useCatalogsControllerGetVersionV1,
  useCatalogsControllerGetCatalogsV1,
} from 'src/api/queries/catalogs/catalogs';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function CatalogListView() {
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: versionData,
    isLoading: isLoadingVersion,
    refetch: refetchVersion,
  } = useCatalogsControllerGetVersionV1();

  const {
    data: catalogData,
    isLoading: isLoadingCatalog,
    refetch: refetchCatalog,
  } = useCatalogsControllerGetCatalogsV1();

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchVersion(), refetchCatalog()]);
      setRefreshKey((prev) => prev + 1);
      toast.success('Catalog refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh catalog');
    }
  }, [refetchVersion, refetchCatalog]);

  const isLoading = isLoadingVersion || isLoadingCatalog;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Catalogs"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Catalogs' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh Catalog
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box
        sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}
      >
        {/* Version Card */}
        <Card>
          <CardHeader
            title="Catalog Version"
            action={
              isLoadingVersion && <LinearProgress sx={{ width: 60, height: 4, borderRadius: 2 }} />
            }
          />

          <Box sx={{ p: 3 }}>
            {versionData?.data ? (
              <Box>
                <Typography variant="h3" color="primary.main" sx={{ mb: 1 }}>
                  v{versionData.data.version}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current catalog version
                </Typography>
                {versionData.data.lastUpdated && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Last updated: {new Date(versionData.data.lastUpdated).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">No version information available</Typography>
            )}
          </Box>
        </Card>

        {/* Catalog Summary Card */}
        <Card>
          <CardHeader
            title="Catalog Summary"
            action={
              isLoadingCatalog && <LinearProgress sx={{ width: 60, height: 4, borderRadius: 2 }} />
            }
          />

          <Box sx={{ p: 3 }}>
            {catalogData?.data ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Data Overview
                </Typography>

                <Box sx={{ display: 'grid', gap: 2 }}>
                  {/* Amenity Categories */}
                  {catalogData.data.data?.amenityCategories && (
                    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary.main">
                        Amenity Categories
                      </Typography>
                      <Typography variant="h4">
                        {catalogData.data.data.amenityCategories.length}
                      </Typography>
                    </Box>
                  )}

                  {/* Enum Displays */}
                  {catalogData.data.data?.enumDisplays && (
                    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary.main">
                        Enum Displays
                      </Typography>
                      <Typography variant="h4">
                        {Object.keys(catalogData.data.data.enumDisplays).length}
                      </Typography>
                    </Box>
                  )}

                  {/* Dynamic Enums */}
                  {catalogData.data.data?.dynamicEnums && (
                    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary.main">
                        Dynamic Enums
                      </Typography>
                      <Typography variant="h4">
                        {Object.keys(catalogData.data.data.dynamicEnums).length}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">No catalog data available</Typography>
            )}
          </Box>
        </Card>
      </Box>

      {/* Detailed Catalog Data */}
      {catalogData?.data && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title="Catalog Details" />

          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Raw Catalog Data
            </Typography>

            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: 'background.neutral',
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                maxHeight: 400,
              }}
            >
              {JSON.stringify(catalogData.data, null, 2)}
            </Box>
          </Box>
        </Card>
      )}
    </DashboardContent>
  );
}
