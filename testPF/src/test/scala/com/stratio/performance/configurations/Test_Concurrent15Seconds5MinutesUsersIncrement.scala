/*
 * © 2017. Stratio Big Data Inc., Sucursal en España. All rights reserved.
 *
 * This software – including all its source code – contains proprietary information of Stratio Big Data Inc.,
 * Sucursal en España and may not be revealed, sold, transferred, modified, distributed or otherwise made
 * available, licensed or sublicensed to third parties; nor reverse engineered, disassembled or decompiled
 * without express written authorization from Stratio Big Data Inc., Sucursal en España.
 */

package com.stratio.performance.configurations

import com.stratio.performance.common.Common
import scala.concurrent.duration._

trait Test_Concurrent15Seconds5MinutesUsersIncrement extends Common {

  override val incrementUsers: Int = 10
  override val usersRampUpTime: FiniteDuration = 15 seconds
//  override val usersSeparatedByTime: FiniteDuration = 5 minutes
  override val usersSeparatedByTime: FiniteDuration = 1 minutes

}
