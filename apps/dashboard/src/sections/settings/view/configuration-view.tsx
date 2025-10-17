'use client';

import type { ConfigurationFormSchemaType } from '../configuration-form';
import type {
  ConfigDataDto,
  ConfigDataDtoCategory,
  ConfigGroupedResponseDtoData,
} from 'src/api/models/admin';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useConfigAdminControllerSet,
  useConfigAdminControllerDelete,
  useConfigAdminControllerGetAllGroupedByCategory,
} from 'src/api/queries/admin/configuration-management/configuration-management';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigurationForm } from '../configuration-form';

// ----------------------------------------------------------------------

interface IConfigFilters {
  search: string;
}

interface ConfigSection {
  title: string;
  description: string;
  icon: string;
  configs: FriendlyConfig[];
}

type ConfigFormData = Record<string, string>;

interface FriendlyConfig extends ConfigDataDto {
  friendlyTitle: string;
  isBoolean: boolean;
}

// Friendly title mappings
const getFriendlyTitle = (key: string): string => {
  const titleMap: Record<string, string> = {
    // Notification settings
    'notify.email': 'Email Notifications',
    'notify.sms': 'SMS Notifications',
    'notify.push': 'Push Notifications',
    'notification.email.enabled': 'Email Notifications',
    'notification.sms.enabled': 'SMS Notifications',

    // Session settings
    'session.timeout': 'Session Timeout',
    'session.max.concurrent': 'Maximum Concurrent Sessions',
    'session.remember.duration': 'Remember Me Duration',
    'session.idle.timeout': 'Idle Session Timeout',
    'session.secure.cookie': 'Secure Session Cookies',
    'auth.session.timeout': 'Authentication Session Timeout',
    'auth.session.lifetime': 'Session Lifetime',

    // App settings
    'app.name': 'Application Name',
    'app.version': 'Application Version',
    'app.url': 'Application URL',
    'app.timezone': 'Default Timezone',
    'app.locale': 'Default Language',
    'app.debug': 'Debug Mode',
    'app.maintenance': 'Maintenance Mode',
    'site.title': 'Site Title',
    'site.description': 'Site Description',

    // API settings
    'api.rate.limit': 'API Rate Limit',
    'api.timeout': 'API Timeout',
    'api.version': 'API Version',
    'api.base.url': 'API Base URL',
    'api.key': 'API Key',

    // Feature flags
    'feature.registration': 'User Registration',
    'feature.social.login': 'Social Media Login',
    'feature.two.factor': 'Two-Factor Authentication',
    'feature.email.verification': 'Email Verification',
    'feature.reviews': 'User Reviews',
    'feature.booking': 'Booking System',
    'enable.chat': 'Live Chat',
    'enable.search': 'Search Functionality',

    // Email settings
    'email.smtp.host': 'SMTP Server Host',
    'email.smtp.port': 'SMTP Server Port',
    'email.smtp.username': 'SMTP Username',
    'email.smtp.password': 'SMTP Password',
    'email.from.address': 'From Email Address',
    'email.from.name': 'From Name',
    'mail.driver': 'Mail Driver',

    // Payment settings
    'payment.stripe.key': 'Stripe Public Key',
    'payment.stripe.secret': 'Stripe Secret Key',
    'payment.paypal.client': 'PayPal Client ID',
    'payment.currency': 'Default Currency',
    'billing.tax.rate': 'Tax Rate',

    // Security settings
    'auth.password.min.length': 'Minimum Password Length',
    'security.encryption.key': 'Encryption Key',
    'jwt.secret': 'JWT Secret',
    'jwt.expiry': 'JWT Expiry Time',
    'oauth.google.client': 'Google OAuth Client ID',
    'oauth.facebook.client': 'Facebook OAuth Client ID',

    // OTP settings
    'otp.expiry': 'OTP Expiry Time',
    'otp.length': 'OTP Length',
    'otp.attempts': 'Maximum OTP Attempts',
    'otp.resend.delay': 'OTP Resend Delay',
  };

  if (titleMap[key]) {
    return titleMap[key];
  }

  // Fallback: convert key to readable format
  return (
    key
      .split('.')
      .pop()
      ?.replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()) || key
  );
};

// Check if a configuration should be treated as boolean
const isConfigBoolean = (key: string, value: string): boolean => {
  const booleanKeys = [
    'notify.email',
    'notify.sms',
    'notify.push',
    'notification.email.enabled',
    'notification.sms.enabled',
    'app.debug',
    'app.maintenance',
    'feature.registration',
    'feature.social.login',
    'feature.two.factor',
    'feature.email.verification',
    'feature.reviews',
    'feature.booking',
    'enable.chat',
    'enable.search',
    'session.secure.cookie',
  ];

  // First check if key is explicitly defined as boolean
  if (booleanKeys.includes(key)) {
    return true;
  }

  // Only treat as boolean if the value is clearly boolean-like
  // Exclude standalone "0" and "1" unless they're for explicitly boolean keys
  const normalizedValue = value.toLowerCase();
  const explicitBooleanValues = ['true', 'false', 'yes', 'no', 'on', 'off'];

  return explicitBooleanValues.includes(normalizedValue);
};

export function ConfigurationView() {
  const confirmDialog = useBoolean();
  const newConfigDialog = useBoolean();

  const [configData, setConfigData] = useState<ConfigDataDto[]>([]);
  const [editingConfig, setEditingConfig] = useState<ConfigDataDto | null>(null);
  const [deletingKey, setDeletingKey] = useState<string>('');
  const [changedConfigs, setChangedConfigs] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const filters = useSetState<IConfigFilters>({
    search: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const formMethods = useForm<ConfigFormData>({
    mode: 'onChange',
  });

  const { register, watch, setValue } = formMethods;
  const watchedValues = watch();

  const {
    data: groupedConfigResponse,
    isLoading,
    refetch,
  } = useConfigAdminControllerGetAllGroupedByCategory();
  const { mutate: setConfig } = useConfigAdminControllerSet();
  const { mutate: deleteConfig } = useConfigAdminControllerDelete();

  const handleSectionToggle = useCallback((sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle) ? prev.filter((s) => s !== sectionTitle) : [...prev, sectionTitle]
    );
  }, []);

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateFilters({ search: event.target.value });
    },
    [updateFilters]
  );

  const handleSaveConfig = useCallback(
    (data: ConfigurationFormSchemaType) => {
      setConfig(
        {
          data: {
            key: data.key,
            value: data.value,
            title: data.title,
            description: data.description,
            category: editingConfig?.category || 'general',
            sortOrder: editingConfig?.sortOrder || 0,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Configuration ${editingConfig ? 'updated' : 'created'} successfully`);
            refetch();
            setEditingConfig(null);
            newConfigDialog.onFalse();
          },
          onError: (error) => {
            console.error('Failed to save configuration:', error);
            toast.error('Failed to save configuration');
          },
        }
      );
    },
    [setConfig, editingConfig, refetch, newConfigDialog]
  );

  const handleDeleteConfig = useCallback(
    (key: string) => {
      setDeletingKey(key);
      confirmDialog.onTrue();
    },
    [confirmDialog]
  );

  const handleConfirmDelete = useCallback(() => {
    if (deletingKey) {
      deleteConfig(
        { key: deletingKey },
        {
          onSuccess: () => {
            toast.success('Configuration deleted successfully');
            refetch();
            confirmDialog.onFalse();
            setDeletingKey('');
          },
          onError: (error) => {
            console.error('Failed to delete configuration:', error);
            toast.error('Failed to delete configuration');
          },
        }
      );
    }
  }, [deleteConfig, deletingKey, refetch, confirmDialog]);

  const handleConfigChange = useCallback(
    (key: string, value: string | boolean) => {
      const stringValue = typeof value === 'boolean' ? value.toString() : value;
      setValue(key, stringValue);
      const originalConfig = configData.find((c) => c.key === key);
      if (originalConfig) {
        if (stringValue !== originalConfig.value) {
          setChangedConfigs((prev) => new Set(prev).add(key));
        } else {
          setChangedConfigs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }
      }
    },
    [setValue, configData]
  );

  const handleSaveChanges = useCallback(async () => {
    const promises = Array.from(changedConfigs).map((key) => {
      const config = configData.find((c) => c.key === key);
      const newValue = watchedValues[key];
      if (config && newValue !== undefined) {
        return new Promise((resolve, reject) => {
          setConfig(
            {
              data: {
                key,
                value: newValue,
                title: config.title,
                description: config.description,
                category: config.category,
                sortOrder: config.sortOrder,
              },
            },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(promises);
      toast.success(`Updated ${changedConfigs.size} configuration(s) successfully`);
      setChangedConfigs(new Set());
      refetch();
    } catch (error) {
      console.error('Failed to update configurations:', error);
      toast.error('Failed to update some configurations');
    }
  }, [changedConfigs, configData, watchedValues, setConfig, refetch]);

  const handleResetChanges = useCallback(() => {
    changedConfigs.forEach((key) => {
      const originalConfig = configData.find((c) => c.key === key);
      if (originalConfig) {
        setValue(key, originalConfig.value);
      }
    });
    setChangedConfigs(new Set());
  }, [changedConfigs, configData, setValue]);

  const getCategoryMetadata = (categoryKey: ConfigDataDtoCategory) => {
    const metadata: Record<
      ConfigDataDtoCategory,
      { title: string; description: string; icon: string }
    > = {
      general: {
        title: 'General Settings',
        description: 'General application configuration',
        icon: 'solar:settings-bold',
      },
      booking: {
        title: 'Booking Settings',
        description: 'Reservation and booking configuration',
        icon: 'solar:calendar-bold',
      },
      payment: {
        title: 'Payment Settings',
        description: 'Payment gateway and billing configuration',
        icon: 'solar:card-bold',
      },
      payout: {
        title: 'Payout Settings',
        description: 'Payout and withdrawal configuration',
        icon: 'solar:wallet-bold',
      },
      notifications: {
        title: 'Notification Settings',
        description: 'General notification preferences',
        icon: 'solar:bell-bold',
      },
      security: {
        title: 'Security Settings',
        description: 'Authentication, OTP, and security configuration',
        icon: 'solar:shield-check-bold',
      },
      features: {
        title: 'Feature Flags',
        description: 'Enable or disable application features',
        icon: 'solar:flag-bold',
      },
      email: {
        title: 'Email Settings',
        description: 'Email notification and SMTP configuration',
        icon: 'solar:letter-bold',
      },
      sms: {
        title: 'SMS Settings',
        description: 'SMS notification configuration',
        icon: 'solar:phone-bold',
      },
      ui: {
        title: 'UI Settings',
        description: 'User interface and display preferences',
        icon: 'solar:monitor-bold',
      },
    };

    return (
      metadata[categoryKey] || {
        title: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
        description: `${categoryKey} configuration settings`,
        icon: 'solar:settings-bold',
      }
    );
  };

  const getConfigSections = useCallback((): ConfigSection[] => {
    if (!groupedConfigResponse?.data) {
      return [];
    }

    const groupedData = groupedConfigResponse.data;
    const sections: ConfigSection[] = [];

    Object.entries(groupedData).forEach(([categoryKey, categoryConfigs]) => {
      if (Array.isArray(categoryConfigs) && categoryConfigs.length > 0) {
        // Sort configs by sortOrder if available
        const sortedConfigs = [...categoryConfigs].sort((a, b) => {
          const aOrder = a.sortOrder ?? 999;
          const bOrder = b.sortOrder ?? 999;
          return aOrder - bOrder;
        });

        // Enhance configs with friendly titles and boolean detection
        const enhancedConfigs = sortedConfigs.map(
          (config) =>
            ({
              ...config,
              friendlyTitle: config.title || getFriendlyTitle(config.key),
              isBoolean: isConfigBoolean(config.key, config.value),
              category: config.category || categoryKey,
            }) as FriendlyConfig
        );

        const categoryMetadata = getCategoryMetadata(categoryKey as ConfigDataDtoCategory);

        sections.push({
          title: categoryMetadata.title,
          description: categoryMetadata.description,
          icon: categoryMetadata.icon,
          configs: enhancedConfigs,
        });
      }
    });

    return sections;
  }, [groupedConfigResponse]);

  useEffect(() => {
    if (groupedConfigResponse?.data) {
      // Convert grouped response to flat array for form handling
      const flatConfigs: ConfigDataDto[] = [];
      Object.values(groupedConfigResponse.data as ConfigGroupedResponseDtoData).forEach(
        (categoryConfigs) => {
          if (Array.isArray(categoryConfigs)) {
            flatConfigs.push(...categoryConfigs);
          }
        }
      );
      setConfigData(flatConfigs);
    }
  }, [groupedConfigResponse]);

  useEffect(() => {
    if (configData.length > 0) {
      // Initialize form values with current config data
      configData.forEach((config) => {
        setValue(config.key, config.value);
      });
    }
  }, [configData, setValue]);

  const configSections = getConfigSections();

  const filteredSections = configSections
    .map((section) => ({
      ...section,
      configs: section.configs.filter(
        (config) =>
          config.key.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
          config.value.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
          (config.description &&
            config.description.toLowerCase().includes(currentFilters.search.toLowerCase()))
      ),
    }))
    .filter((section) => section.configs.length > 0);

  const renderSearchToolbar = () => (
    <Box sx={{ p: 3, pb: 0 }}>
      <TextField
        fullWidth
        value={currentFilters.search}
        onChange={handleFilterSearch}
        placeholder="Search configurations..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ maxWidth: { md: 400 } }}
      />
    </Box>
  );

  const renderConfigField = (config: FriendlyConfig) => {
    const currentValue = watchedValues[config.key] || config.value;
    const hasChanges = changedConfigs.has(config.key);
    const isLongValue = currentValue && currentValue.length > 80;

    // Convert string values to boolean for switch components
    const booleanValue = config.isBoolean
      ? ['true', '1', 'yes', 'on'].includes(currentValue.toLowerCase())
      : false;

    return (
      <Box key={config.key}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {config.friendlyTitle}
            </Typography>
          </Box>
          <IconButton size="small" color="error" onClick={() => handleDeleteConfig(config.key)}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>

        {config.description && (
          <Typography variant="body2" sx={{ color: 'text.disabled', mb: 1 }}>
            {config.description}
          </Typography>
        )}

        {config.isBoolean ? (
          <FormControlLabel
            control={
              <Switch
                checked={booleanValue}
                onChange={(e) => handleConfigChange(config.key, e.target.checked)}
                size="medium"
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {booleanValue ? 'Enabled' : 'Disabled'}
              </Typography>
            }
            sx={{
              m: 0,
              pr: 2,
              border: '1px solid',
              borderColor: hasChanges ? 'warning.main' : 'divider',
              borderRadius: 1,
              backgroundColor: hasChanges ? 'warning.lighter' : 'background.paper',
              width: '100%',
              justifyContent: 'space-between',
            }}
          />
        ) : (
          <TextField
            {...register(config.key)}
            fullWidth
            value={currentValue}
            onChange={(e) => handleConfigChange(config.key, e.target.value)}
            multiline={Boolean(isLongValue)}
            rows={isLongValue ? 3 : 1}
            size="small"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: hasChanges ? 'warning.lighter' : 'background.paper',
              },
            }}
          />
        )}

        {hasChanges && (
          <Typography variant="caption" sx={{ color: 'warning.main', mt: 0.5, display: 'block' }}>
            Modified
          </Typography>
        )}
      </Box>
    );
  };

  const renderSection = (section: ConfigSection) => {
    const isExpanded = expandedSections.includes(section.title);

    return (
      <Accordion
        key={section.title}
        expanded={isExpanded}
        onChange={() => handleSectionToggle(section.title)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Iconify
              icon={section.icon}
              sx={{ mr: 2, color: 'primary.main', width: 24, height: 24 }}
            />
            <Box>
              <Typography variant="h6">{section.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {section.description} ({section.configs.length} settings)
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            {section.configs.map((config) => renderConfigField(config))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete Configuration"
      content={`Are you sure you want to delete the configuration "${deletingKey}"?`}
      action={
        <Button variant="contained" color="error" onClick={handleConfirmDelete}>
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Configuration Settings"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Settings' },
            { name: 'Configuration' },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={newConfigDialog.onTrue}
            >
              New Configuration
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          {renderSearchToolbar()}

          {isLoading ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <Typography>Loading configurations...</Typography>
            </Box>
          ) : filteredSections.length > 0 ? (
            <>
              <Box sx={{ p: 3 }}>{filteredSections.map((section) => renderSection(section))}</Box>

              {changedConfigs.size > 0 && (
                <Card sx={{ p: 3, m: 3, backgroundColor: 'warning.lighter' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Unsaved Changes
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        You have {changedConfigs.size} unsaved configuration(s)
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" color="inherit" onClick={handleResetChanges}>
                        Reset
                      </Button>
                      <Button variant="contained" color="warning" onClick={handleSaveChanges}>
                        Save Changes
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No configurations found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {currentFilters.search
                  ? 'Try adjusting your search criteria'
                  : 'Start by creating your first configuration'}
              </Typography>
            </Box>
          )}
        </Card>
      </DashboardContent>

      <ConfigurationForm
        open={newConfigDialog.value || !!editingConfig}
        onClose={() => {
          newConfigDialog.onFalse();
          setEditingConfig(null);
        }}
        onSave={handleSaveConfig}
        currentConfig={editingConfig}
      />

      {renderConfirmDialog()}
    </>
  );
}
