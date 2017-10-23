import moment from 'moment';
import _ from 'lodash';

import User from '../models/user';

/**
 * controller for user login
 * POST /user/login
 */
export const login = (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);

  User.findUserByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  });
};

/**
 * controller for user logout
 * DELETE /user/logout
 */
export const logout = (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
};

/**
 * controller to send forgot password link
 * POST /forgot-password
 * required email
 */
export const sendOTPLink = (req, res) => {
  const email = req.body.email;

  if(!email) {
    return res.status(400).send('Please provide email ID');
  }

  User.findOne({ email })
    .then(user => {
      if(!user) {
        return Promise.reject({'status': 404});
      }

      return user.generateOTP();
    })
    .then(user => {
      res.status(200).send({
        'otp': user.otp,
        'userID': user._id
      });
    })
    .catch(err => {
      const errCode = err && err.status ? err.status : 400;
      const errMsg = errCode === 404 ?
                    'No such user registered' :
                    'Error while sending reset password link, Please try again';

      res.status(errCode).send(errMsg);
    });
};

/**
 * controller to reset the password
 * POST /reset-password
 * required otp, userID, password
 */
export const resetPassword = (req, res) => {
  const userId = req.body.userId;
  const otp = req.body.otp;
  const password = req.body.password;

  if(!userId || !otp || !password) {
    return res.status(400).send('Unable to reset password, Please provide required data');
  }

  User.findById(userId)
    .then(user => {
      if(!user) {
        return Promise.reject({'status': 404});
      }

      return user.verifyOTPAndResetPassword(otp, password);
    })
    .then(user => {
      res.status(200).send('Password has been reset successfully');
    })
    .catch(err => {
      const errCode = err && err.status ? err.status : 400;
      const errMsg = errCode === 404 ?
                    'No such user registered' :
                    'Reset password link has expired, Please try again';

      res.status(errCode).send(errMsg);
    });

};