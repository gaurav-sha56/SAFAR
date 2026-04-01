export const FLEET_BASE_SELECT = 'id, owner_name, invite_code';
export const FLEET_OWNER_SELECT = `${FLEET_BASE_SELECT}, owner_user_id, owner_email`;

export function formatSupabaseError(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  const parts = [error.message, error.details, error.hint].filter(Boolean);
  return parts.length ? parts.join(' | ') : fallbackMessage;
}

export function normalizeOwnerEmail(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

function withFleetIdentity(fleet) {
  if (!fleet) return null;
  return {
    ...fleet,
    owner_user_id: fleet.owner_user_id ?? null,
    owner_email: fleet.owner_email ?? null,
  };
}

function isOwnerIdentityColumnError(error) {
  if (!error) return false;

  const combined = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  return combined.includes('owner_user_id') || combined.includes('owner_email');
}

async function findFleetByColumn(supabase, column, value) {
  if (!value) {
    return { fleet: null, error: null, ambiguous: false, schemaMissing: false };
  }

  const { data, error } = await supabase
    .from('fleets')
    .select(FLEET_OWNER_SELECT)
    .eq(column, value)
    .limit(2);

  if (error) {
    if (isOwnerIdentityColumnError(error)) {
      return { fleet: null, error: null, ambiguous: false, schemaMissing: true };
    }
    return { fleet: null, error, ambiguous: false, schemaMissing: false };
  }

  if (!data?.length) {
    return { fleet: null, error: null, ambiguous: false, schemaMissing: false };
  }

  if (data.length > 1) {
    return { fleet: null, error: null, ambiguous: true, schemaMissing: false };
  }

  return { fleet: withFleetIdentity(data[0]), error: null, ambiguous: false, schemaMissing: false };
}

async function backfillFleetOwnerIdentity(supabase, fleet, ownerUserId, ownerEmail) {
  if (!fleet?.id) {
    return { fleet, error: null };
  }

  const normalizedEmail = normalizeOwnerEmail(ownerEmail);
  const updates = {};

  if (ownerUserId && fleet.owner_user_id !== ownerUserId) {
    updates.owner_user_id = ownerUserId;
  }

  if (normalizedEmail && fleet.owner_email !== normalizedEmail) {
    updates.owner_email = normalizedEmail;
  }

  if (!Object.keys(updates).length) {
    return { fleet, error: null };
  }

  const { data, error } = await supabase
    .from('fleets')
    .update(updates)
    .eq('id', fleet.id)
    .select(FLEET_OWNER_SELECT)
    .single();

  if (error && isOwnerIdentityColumnError(error)) {
    return { fleet: withFleetIdentity(fleet), error: null };
  }

  return { fleet: withFleetIdentity(data ?? fleet), error };
}

export async function resolveFleet(supabase, { fleetId, ownerUserId, ownerEmail }) {
  const normalizedEmail = normalizeOwnerEmail(ownerEmail);

  if (fleetId) {
    let { data: fleetById, error: fleetByIdError } = await supabase
      .from('fleets')
      .select(FLEET_OWNER_SELECT)
      .eq('id', fleetId)
      .maybeSingle();

    if (fleetByIdError && isOwnerIdentityColumnError(fleetByIdError)) {
      const fallback = await supabase
        .from('fleets')
        .select(FLEET_BASE_SELECT)
        .eq('id', fleetId)
        .maybeSingle();

      fleetById = fallback.data;
      fleetByIdError = fallback.error;
    }

    if (fleetByIdError) {
      return { fleet: null, error: fleetByIdError, ambiguous: false };
    }

    if (fleetById) {
      const { fleet, error } = await backfillFleetOwnerIdentity(supabase, withFleetIdentity(fleetById), ownerUserId, normalizedEmail);
      return { fleet, error, ambiguous: false };
    }
  }

  const ownerUserResult = await findFleetByColumn(supabase, 'owner_user_id', ownerUserId);
  if (ownerUserResult.error || ownerUserResult.ambiguous || ownerUserResult.fleet) {
    if (ownerUserResult.fleet) {
      const { fleet, error } = await backfillFleetOwnerIdentity(supabase, ownerUserResult.fleet, ownerUserId, normalizedEmail);
      return { fleet, error, ambiguous: false };
    }
    if (ownerUserResult.schemaMissing) {
      return { fleet: null, error: null, ambiguous: false };
    }
    return ownerUserResult;
  }

  const ownerEmailResult = await findFleetByColumn(supabase, 'owner_email', normalizedEmail);
  if (ownerEmailResult.error || ownerEmailResult.ambiguous || ownerEmailResult.fleet) {
    if (ownerEmailResult.fleet) {
      const { fleet, error } = await backfillFleetOwnerIdentity(supabase, ownerEmailResult.fleet, ownerUserId, normalizedEmail);
      return { fleet, error, ambiguous: false };
    }
    if (ownerEmailResult.schemaMissing) {
      return { fleet: null, error: null, ambiguous: false };
    }
    return ownerEmailResult;
  }

  return { fleet: null, error: null, ambiguous: false };
}
