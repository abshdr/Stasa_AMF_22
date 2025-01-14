package com.stasa.configurations;

import com.stasa.entities.User;
import com.stasa.repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Calendar;
import java.util.Date;


@Configuration
@CrossOrigin(origins="http://localhost:3000")
public class MyUserDetailsService implements UserDetailsService {

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    public BCryptPasswordEncoder getEncoder() { return encoder; }

    @Autowired
    private UserRepo userRepo;

//  Springs way of calling the constructor
//  @PostConstruct
//  private void createDefaultUsers(){
//    if (userRepo.findByUsername("user") == null) {
//      addUser("user", "password");
//    }
//  }

    @Override
    public UserDetails loadUserByUsername(String email) {
        String email1 = Base64.getEncoder().encodeToString(email.getBytes());
        User user = userRepo.findByEmail(email1);
        if(user == null){
            throw new UsernameNotFoundException("User not found by email:"+ email1);
        }
        return toUserDetails(user);
    }

    public User addUser(User user){
        //encrypt password before saving
        System.out.println(user);
        user.setPassword(encoder.encode(user.getPassword()));
        user.setEmail(Base64.getEncoder().encodeToString(user.getEmail().getBytes()));
        System.out.println(user);
        try {
            return userRepo.save(user); // skickar till db direkt.
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }

    // >>>>>>>>>>>>>>>>>>>> Varför heter den här metoden updateUser ifall den markerar en användare som deleted?
    public User updateUser(User user){
        //todo: byta lösenord nedan,,
        //user.setPassword(encoder.encode(user.getPassword()));
        //--------

        user.setEnabled(false);
        Date date = Calendar.getInstance().getTime();
        DateFormat dateFormat = new SimpleDateFormat("yyyy-mm-dd hh:mm:ss");
        String strDate = dateFormat.format(date);
        user.setDeletionTimestamp(strDate);
        try {
            System.out.println(user);
            return userRepo.save(user);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }

    private UserDetails toUserDetails(User user) {
        // If you have a User entity you have to
        // use the userdetails User for this to work
        //OM DU NÅGONSIN ANVÄNDER SPRING LOGIN IGEN SÅ GLÖM INTE INDEX.HTML FIL!!!
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .disabled(!user.isEnabled())
                .roles("USER").build();
    }
}