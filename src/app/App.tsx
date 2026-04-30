import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { TodayScreen } from '../features/tasks/components/TodayScreen'
import { TasksScreen } from '../features/tasks/components/TasksScreen'
import { FinanceLayout } from '../features/finance/components/FinanceLayout'
import { FinanceOverview } from '../features/finance/components/FinanceOverview'
import { LogExpense } from '../features/finance/components/LogExpense'
import { LogRefund } from '../features/finance/components/LogRefund'
import { LogSplitwise } from '../features/finance/components/LogSplitwise'
import { LogSubscription } from '../features/finance/components/LogSubscription'
import { BudgetsScreen } from '../features/finance/components/BudgetsScreen'
import { AccountsScreen } from '../features/finance/components/AccountsScreen'
import { TaxScreen } from '../features/finance/components/TaxScreen'
import { SilentBleedReport } from '../features/finance/components/SilentBleedReport'
import { HealthLayout } from '../features/health/components/HealthLayout'
import { HealthOverview } from '../features/health/components/HealthOverview'
import { MedicalScreen } from '../features/health/components/MedicalScreen'
import { HistoryScreen } from '../features/health/components/HistoryScreen'
import { LivingLayout } from '../features/living/components/LivingLayout'
import { ExploreScreen } from '../features/living/components/ExploreScreen'
import { ActivitiesScreen } from '../features/living/components/ActivitiesScreen'
import { DoneScreen } from '../features/living/components/DoneScreen'
import { GrowthLayout } from '../features/growth/components/GrowthLayout'
import { GrowthOverview } from '../features/growth/components/GrowthOverview'
import { BooksScreen } from '../features/growth/components/BooksScreen'
import { CalendarScreen } from '../features/growth/components/CalendarScreen'
import { PlanLayout } from '../features/plan/components/PlanLayout'
import { GoalsScreen } from '../features/plan/components/GoalsScreen'
import { GoalDetail } from '../features/plan/components/GoalDetail'
import { ProjectsScreen } from '../features/plan/components/ProjectsScreen'
import { ProjectDetail } from '../features/plan/components/ProjectDetail'

import { ROUTES } from './routes'
import { RoutinesScreen } from '../features/routines/RoutinesScreen'
import { RoutineRunView } from '../features/routines/RoutineRunView'
import { RoutineEditView } from '../features/routines/RoutineEditView'
import { LogTypeSelector } from '../features/finance/components/LogTypeSelector'
import { ExpensesScreen } from '../features/finance/components/ExpensesScreen'
import { FocusScreen } from '../features/focus/FocusScreen'

// ─── App.tsx ───────────────────────────────────────────────────────────────────

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={ROUTES.TODAY} replace />} />
          <Route path={ROUTES.TODAY} element={<TodayScreen />} />
          <Route path={ROUTES.TASKS} element={<TasksScreen />} />
          <Route path="/routines" element={<RoutinesScreen />} />
          <Route path="/routines/:routineId/run" element={<RoutineRunView />} />
          <Route
            path="/routines/:routineId/edit"
            element={<RoutineEditView />}
          />

          <Route path={ROUTES.FINANCE} element={<FinanceLayout />}>
            <Route index element={<FinanceOverview />} />
            <Route path="log" element={<LogTypeSelector />} />
            <Route path="log/expense" element={<LogExpense />} />
            <Route path="log/refund" element={<LogRefund />} />
            <Route path="log/splitwise" element={<LogSplitwise />} />
            <Route path="log/subscription" element={<LogSubscription />} />
            <Route path="budgets" element={<BudgetsScreen />} />
            <Route path="accounts" element={<AccountsScreen />} />
            <Route path="tax" element={<TaxScreen />} />
            <Route path="bleed" element={<SilentBleedReport />} />
            <Route path="expenses" element={<ExpensesScreen />} />
          </Route>

          <Route path={ROUTES.HEALTH} element={<HealthLayout />}>
            <Route index element={<HealthOverview />} />
            <Route path={ROUTES.HEALTH_MEDICAL} element={<MedicalScreen />} />
            <Route path={ROUTES.HEALTH_HISTORY} element={<HistoryScreen />} />
          </Route>

          <Route path={ROUTES.LIVING} element={<LivingLayout />}>
            <Route index element={<ExploreScreen />} />
            <Route
              path={ROUTES.LIVING_ACTIVITIES}
              element={<ActivitiesScreen />}
            />
            <Route path={ROUTES.LIVING_DONE} element={<DoneScreen />} />
          </Route>

          <Route path={ROUTES.GROWTH} element={<GrowthLayout />}>
            <Route index element={<GrowthOverview />} />
            <Route path={ROUTES.GROWTH_BOOKS} element={<BooksScreen />} />
            <Route path={ROUTES.GROWTH_CALENDAR} element={<CalendarScreen />} />
          </Route>

          <Route path={ROUTES.PLAN} element={<PlanLayout />}>
            <Route
              index
              element={<Navigate to={ROUTES.PLAN_GOALS} replace />}
            />
            <Route path="goals" element={<GoalsScreen />} />
            <Route path="projects" element={<ProjectsScreen />} />
            <Route path="goals/:goalId" element={<GoalDetail />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
          </Route>
          <Route path="/focus" element={<FocusScreen />} />
          <Route path="*" element={<Navigate to={ROUTES.TODAY} replace />} />
        </Route>
        <Route path="/routines/:routineId/run" element={<RoutineRunView />} />
      </Routes>
    </BrowserRouter>
  )
}
