const state = {
  opportunities: [],
  selectedId: null,
  filter: 'All',
  query: ''
};

const opportunityList = document.querySelector('#opportunity-list');
const detailsPanel = document.querySelector('#details-panel');
const resultCount = document.querySelector('#result-count');
const editorDialog = document.querySelector('#editor-dialog');
const opportunityForm = document.querySelector('#opportunity-form');
const toast = document.querySelector('#toast');
let toastTimer;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(date);
}

function filteredOpportunities() {
  const normalizedQuery = state.query.trim().toLowerCase();
  return state.opportunities.filter((opportunity) => {
    const matchesStatus = state.filter === 'All' || opportunity.status === state.filter;
    const searchable = [
      opportunity.title,
      opportunity.research_area,
      opportunity.faculty_name,
      opportunity.department,
      opportunity.required_skills
    ].join(' ').toLowerCase();
    return matchesStatus && searchable.includes(normalizedQuery);
  });
}

function renderStats() {
  document.querySelector('#total-count').textContent = state.opportunities.length;
  document.querySelector('#open-count').textContent = state.opportunities
    .filter((item) => item.status === 'Open')
    .reduce((total, item) => total + Number(item.available_positions), 0);
  document.querySelector('#closed-count').textContent = state.opportunities.filter((item) => item.status === 'Closed').length;
}

function renderList() {
  const opportunities = filteredOpportunities();
  opportunityList.replaceChildren();
  resultCount.textContent = `${opportunities.length} ${opportunities.length === 1 ? 'listing' : 'listings'}`;

  if (opportunities.length === 0) {
    const message = state.opportunities.length === 0
      ? 'No opportunities yet. Create the first listing to get started.'
      : 'No listings match these filters.';
    opportunityList.append(element('p', 'list-message', message));
    return;
  }

  for (const opportunity of opportunities) {
    const card = element('button', 'opportunity-card');
    card.type = 'button';
    card.classList.toggle('is-selected', opportunity.id === state.selectedId);
    card.setAttribute('aria-pressed', String(opportunity.id === state.selectedId));

    const topLine = element('div', 'card-topline');
    topLine.append(element('span', 'card-area', opportunity.research_area));
    const badge = element('span', 'status-badge', opportunity.status);
    badge.classList.toggle('is-closed', opportunity.status === 'Closed');
    topLine.append(badge);

    const title = element('h3', 'card-title', opportunity.title);
    const faculty = element('p', 'card-faculty', `${opportunity.faculty_name} · ${opportunity.department}`);
    const meta = element('div', 'card-meta');
    meta.append(
      element('span', '', `${opportunity.available_positions} ${Number(opportunity.available_positions) === 1 ? 'position' : 'positions'}`),
      element('span', '', `Deadline ${formatDate(opportunity.application_deadline)}`)
    );
    card.append(topLine, title, faculty, meta);
    card.addEventListener('click', () => {
      state.selectedId = opportunity.id;
      renderList();
      renderDetails();
    });
    opportunityList.append(card);
  }
}

function detailFact(label, value) {
  const wrapper = element('div', 'detail-fact');
  wrapper.append(element('span', 'fact-label', label), element('span', 'fact-value', value));
  return wrapper;
}

function detailSection(label, value) {
  const section = element('section', 'detail-section');
  section.append(element('h3', '', label), element('p', '', value));
  return section;
}

function renderDetails() {
  const opportunity = state.opportunities.find((item) => item.id === state.selectedId);
  detailsPanel.replaceChildren();
  if (!opportunity) {
    const empty = element('div', 'details-empty');
    empty.append(
      element('span', 'empty-mark', '↗'),
      element('h2', '', 'Select an opportunity'),
      element('p', '', 'Choose a listing to see its full project details.')
    );
    detailsPanel.append(empty);
    return;
  }

  const topLine = element('div', 'detail-topline');
  topLine.append(element('span', 'detail-area', opportunity.research_area));
  const badge = element('span', 'status-badge', opportunity.status);
  badge.classList.toggle('is-closed', opportunity.status === 'Closed');
  topLine.append(badge);

  const heading = element('h2', 'detail-title', opportunity.title);
  const byline = element('p', 'detail-byline', `${opportunity.faculty_name} · ${opportunity.department}`);
  const facts = element('div', 'detail-facts');
  facts.append(
    detailFact('Positions available', String(opportunity.available_positions)),
    detailFact('Application deadline', formatDate(opportunity.application_deadline))
  );

  const actions = element('div', 'detail-actions');
  const editButton = element('button', 'button button-quiet', 'Edit details');
  editButton.type = 'button';
  editButton.addEventListener('click', () => openEditor(opportunity));
  const statusButton = element('button', 'button button-quiet', opportunity.status === 'Open' ? 'Close listing' : 'Reopen listing');
  statusButton.type = 'button';
  statusButton.addEventListener('click', () => updateStatus(opportunity));
  const deleteButton = element('button', 'button button-danger', 'Delete');
  deleteButton.type = 'button';
  deleteButton.addEventListener('click', () => deleteOpportunity(opportunity));
  actions.append(editButton, statusButton, deleteButton);

  detailsPanel.append(
    topLine,
    heading,
    byline,
    detailSection('Project description', opportunity.description),
    facts,
    detailSection('Required skills', opportunity.required_skills),
    actions
  );
}

async function refreshOpportunities(preferredId = state.selectedId) {
  const opportunities = await apiRequest('/api/opportunities');
  state.opportunities = opportunities;
  const selectedStillExists = opportunities.some((item) => item.id === preferredId);
  state.selectedId = selectedStillExists ? preferredId : (opportunities[0]?.id ?? null);
  renderStats();
  renderList();
  renderDetails();
}

function openEditor(opportunity = null) {
  opportunityForm.reset();
  opportunityForm.dataset.id = opportunity ? String(opportunity.id) : '';
  document.querySelector('#dialog-title').textContent = opportunity ? 'Edit opportunity' : 'New opportunity';
  document.querySelector('#save-opportunity').textContent = opportunity ? 'Save changes' : 'Publish opportunity';
  if (opportunity) {
    for (const [field, value] of Object.entries(opportunity)) {
      const input = opportunityForm.elements.namedItem(field);
      if (input) input.value = value;
    }
  } else {
    opportunityForm.elements.namedItem('status').value = 'Open';
  }
  editorDialog.showModal();
}

async function saveOpportunity(event) {
  event.preventDefault();
  if (!opportunityForm.reportValidity()) return;

  const opportunity = Object.fromEntries(new FormData(opportunityForm).entries());
  opportunity.available_positions = Number(opportunity.available_positions);
  const id = opportunityForm.dataset.id;
  const button = document.querySelector('#save-opportunity');
  button.disabled = true;

  try {
    const saved = await apiRequest(id ? `/api/opportunities/${id}` : '/api/opportunities', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(opportunity)
    });
    editorDialog.close();
    await refreshOpportunities(saved.id);
    showToast(id ? 'Opportunity updated.' : 'Opportunity created.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function updateStatus(opportunity) {
  const status = opportunity.status === 'Open' ? 'Closed' : 'Open';
  try {
    await apiRequest(`/api/opportunities/${opportunity.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await refreshOpportunities(opportunity.id);
    showToast(status === 'Closed' ? 'Opportunity closed.' : 'Opportunity reopened.');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteOpportunity(opportunity) {
  if (!window.confirm(`Delete “${opportunity.title}”? This cannot be undone.`)) return;
  try {
    await apiRequest(`/api/opportunities/${opportunity.id}`, { method: 'DELETE' });
    await refreshOpportunities();
    showToast('Opportunity deleted.');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function checkConnection() {
  const indicator = document.querySelector('#connection-indicator');
  const label = document.querySelector('#connection-label');
  try {
    await apiRequest('/api/health');
    indicator.classList.add('is-connected');
    label.textContent = 'Portal connected';
  } catch {
    indicator.classList.add('is-error');
    label.textContent = 'Portal unavailable';
  }
}

document.querySelector('#new-opportunity').addEventListener('click', () => openEditor());
document.querySelector('#close-dialog').addEventListener('click', () => editorDialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => editorDialog.close());
opportunityForm.addEventListener('submit', saveOpportunity);
document.querySelector('#search-input').addEventListener('input', (event) => {
  state.query = event.target.value;
  renderList();
});

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('is-active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    renderList();
  });
});

checkConnection();
refreshOpportunities().catch((error) => {
  resultCount.textContent = 'Unable to load listings';
  opportunityList.replaceChildren(element('p', 'list-message', error.message));
  showToast(error.message, true);
});
