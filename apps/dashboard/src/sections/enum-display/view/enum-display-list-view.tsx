'use client';

import type { EnumDisplayDataDto } from 'src/api/models/admin';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { useEnumDisplaysAdminControllerFindAll } from 'src/api/queries/admin/enum-displays-management/enum-displays-management';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EnumDisplayCard } from '../enum-display-card';

// ----------------------------------------------------------------------

interface GroupedEnumData {
  [enumName: string]: EnumDisplayDataDto[];
}

export function EnumDisplayListView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch enum display data
  const { data: enumDisplaysData, isLoading } = useEnumDisplaysAdminControllerFindAll();

  // Process data into grouped format
  const groupedData = useMemo<GroupedEnumData>(() => {
    if (!enumDisplaysData?.data) return {};

    // Check if data is already grouped (object of arrays)
    if (!Array.isArray(enumDisplaysData.data)) {
      return enumDisplaysData.data as GroupedEnumData;
    }

    // If data is a flat array, group by enumName
    const grouped: GroupedEnumData = {};
    enumDisplaysData.data.forEach((item: EnumDisplayDataDto) => {
      if (!grouped[item.enumName]) {
        grouped[item.enumName] = [];
      }
      grouped[item.enumName].push(item);
    });

    return grouped;
  }, [enumDisplaysData?.data]);

  // Filter enums based on search query
  const filteredEnums = useMemo(() => {
    if (!searchQuery) return groupedData;

    const filtered: GroupedEnumData = {};
    Object.entries(groupedData).forEach(([enumName, items]) => {
      if (
        enumName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        items.some(
          (item) =>
            item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof item.label === 'object' &&
              Object.values(item.label as Record<string, string>).some((val) =>
                val.toLowerCase().includes(searchQuery.toLowerCase())
              ))
        )
      ) {
        filtered[enumName] = items;
      }
    });

    return filtered;
  }, [groupedData, searchQuery]);

  const enumNames = Object.keys(filteredEnums);

  const handleViewDetails = useCallback(
    (enumName: string) => {
      // Navigate to detail page with enum as query parameter
      router.push(`${paths.dashboard.enumDisplays.detail}?enum=${enumName}`);
    },
    [router]
  );

  const handleEditEnum = useCallback(
    (enumName: string) => {
      // Navigate to edit page with enumName as query parameter
      router.push(`${paths.dashboard.enumDisplays.new}?enumName=${enumName}`);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Enum Displays"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'System', href: paths.dashboard.enumDisplays.root },
          { name: 'Enum Displays' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.enumDisplays.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Enum Display
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search enum types, keys, or labels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ maxWidth: 480 }}
        />
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && enumNames.length === 0 && (
        <EmptyContent
          title="No enum displays found"
          description={
            searchQuery
              ? 'Try adjusting your search criteria'
              : 'Create your first enum display to get started'
          }
          sx={{ py: 8 }}
        />
      )}

      {/* Enum Cards Grid */}
      {!isLoading && enumNames.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {enumNames.length} enum type{enumNames.length !== 1 ? 's' : ''} found
          </Typography>

          <Grid container spacing={3}>
            {enumNames.map((enumName) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={enumName}>
                <EnumDisplayCard
                  enumName={enumName}
                  items={filteredEnums[enumName]}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditEnum}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </DashboardContent>
  );
}
