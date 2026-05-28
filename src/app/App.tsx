import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { TodayScreen } from '../features/today/components/TodayScreen'
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
import { HealthLayout } from '../features/health/components/HealthLayout'
import { MedicalScreen } from '../features/health/components/MedicalScreen'
import { AuditScreen } from '../features/health/components/AuditScreen'
import { ThaliPlanner } from '../features/health/components/ThaliPlanner'
import { HealthRoutines } from '../features/health/components/HealthRoutines'
import { LivingLayout } from '../features/living/components/LivingLayout'
import { ExploreScreen } from '../features/living/components/ExploreScreen'
import { ActivitiesScreen } from '../features/living/components/ActivitiesScreen'
import { DoneScreen } from '../features/living/components/DoneScreen'
import { ShoppingScreen } from '../features/health/components/ShoppingScreen'
import { WishlistScreen } from '../features/living/components/WishlistScreen'
import { GrowthLayout } from '../features/growth/components/GrowthLayout'
import { GrowthOverview } from '../features/growth/components/GrowthOverview'
import { SprintTab } from '../features/tasks/components/SprintTab'
import { BooksScreen } from '../features/growth/components/BooksScreen'
import { CalendarScreen } from '../features/growth/components/CalendarScreen'
import { GoalsScreen } from '../features/plan/components/GoalsScreen'
import { GoalDetail } from '../features/plan/components/GoalDetail'
import { ProjectsScreen } from '../features/plan/components/ProjectsScreen'
import { ProjectDetail } from '../features/plan/components/ProjectDetail'

import { ROUTES } from './routes'
import { RoutinesScreen } from '../features/routines/components/RoutinesScreen'
import { RoutineRunView } from '../features/routines/components/RoutineRunView'
import { RoutineEditView } from '../features/routines/components/RoutineEditView'
import { LogTypeSelector } from '../features/finance/components/LogTypeSelector'
import { ExpensesScreen } from '../features/finance/components/ExpensesScreen'
import { ExpenseGroupsScreen } from '../features/finance/components/ExpenseGroupsScreen'
import { FocusScreen } from '../features/focus/components/FocusScreen'
import { MeetingsScreen } from '../features/meetings/components/MeetingsScreen'
import { MeetingDetail } from '../features/meetings/components/MeetingDetail'
import { InboxLayout } from '../features/inbox/InboxLayout'
import { BrainDumpScreen } from '../features/braindump/components/BrainDumpScreen'
import { WeeklyReviewScreen } from '../features/today/components/WeeklyReviewScreen'
import { PastWeeksScreen } from '../features/today/components/PastWeeksScreen'

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
            <Route path="log">
              <Route index element={<LogTypeSelector />} />
              <Route path="expense" element={<LogExpense />} />
              <Route path="refund" element={<LogRefund />} />
              <Route path="splitwise" element={<LogSplitwise />} />
              <Route path="subscription" element={<LogSubscription />} />
            </Route>
            <Route path="budgets" element={<BudgetsScreen />} />
            <Route path="accounts" element={<AccountsScreen />} />
            <Route path="tax" element={<TaxScreen />} />
            <Route path="expenses" element={<ExpensesScreen />} />
            <Route path="groups" element={<ExpenseGroupsScreen />} />
          </Route>

          <Route path={ROUTES.HEALTH} element={<HealthLayout />}>
            <Route index element={<MedicalScreen />} />
            <Route path="routines" element={<HealthRoutines />} />
            <Route path="thali" element={<ThaliPlanner />} />
            <Route path="audit" element={<AuditScreen />} />
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
            <Route index element={<SprintTab />} />
            <Route path="learning" element={<GrowthOverview />} />
            <Route path="tasks" element={<TasksScreen />} />
            <Route path="meetings" element={<MeetingsScreen />} />
            <Route path="meetings/:id" element={<MeetingDetail />} />
            <Route path="routines" element={<RoutinesScreen />} />
            <Route path="books" element={<BooksScreen />} />
            <Route path="calendar" element={<CalendarScreen />} />
            <Route path="past-weeks" element={<PastWeeksScreen />} />
            <Route path="goals" element={<GoalsScreen />} />
            <Route path="goals/:goalId" element={<GoalDetail />} />
            <Route path="projects" element={<ProjectsScreen />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
          </Route>

          <Route path={ROUTES.INBOX} element={<InboxLayout />}>
            <Route index element={<BrainDumpScreen />} />
            <Route path="shopping" element={<ShoppingScreen />} />
            <Route path="wishlist" element={<WishlistScreen />} />
          </Route>

          <Route path="/focus" element={<FocusScreen />} />
          <Route path={ROUTES.WEEKLY_REVIEW} element={<WeeklyReviewScreen />} />
          <Route path="*" element={<Navigate to={ROUTES.TODAY} replace />} />
        </Route>
        <Route path="/routines/:routineId/run" element={<RoutineRunView />} />
      </Routes>
    </BrowserRouter>
  )
}
